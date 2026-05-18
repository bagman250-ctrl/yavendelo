"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";

import { auth, db } from "@/app/firebase/config";
import BottomNav from "@/components/BottomNav";
import SafeTradeNote from "@/components/SafeTradeNote";
import TopBar from "@/components/TopBar";
import UserAvatar from "@/components/UserAvatar";

type Message = {
  id: string;
  text: string;
  sender: string;
  senderId?: string;
  createdAt?: { seconds?: number } | number | string;
};

type Conversation = {
  id: string;
  productTitle?: string;
  buyerId?: string;
  sellerId?: string;
  buyerName?: string;
  sellerName?: string;
  buyerPhotoURL?: string;
  sellerPhotoURL?: string;
};

function getDateValue(value?: Message["createdAt"]) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return Number(value?.seconds || 0);
}

function formatMessageTime(value?: Message["createdAt"]) {
  const rawValue = getDateValue(value);
  if (!rawValue) return "";

  const millis = rawValue < 10000000000 ? rawValue * 1000 : rawValue;
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(millis));
}

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const chatId = params.id;
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const currentUser = auth.currentUser?.displayName || auth.currentUser?.email || "Usuario";
  const currentPhotoURL = auth.currentUser?.photoURL || "";
  const otherUserName =
    conversation?.sellerId === auth.currentUser?.uid ? conversation?.buyerName : conversation?.sellerName;
  const otherUserPhoto =
    conversation?.sellerId === auth.currentUser?.uid ? conversation?.buyerPhotoURL : conversation?.sellerPhotoURL;
  const otherUserRole = conversation?.sellerId === auth.currentUser?.uid ? "Comprador" : "Vendedor";

  useEffect(() => {
    if (!chatId) return;

    let unsubscribeMessages: (() => void) | undefined;

    async function loadConversation() {
      try {
        const conversationRef = doc(db, "conversations", chatId);
        const conversationSnap = await getDoc(conversationRef);

        if (conversationSnap.exists()) {
          setConversation({ id: conversationSnap.id, ...conversationSnap.data() } as Conversation);
        }

        const messagesQuery = query(collection(db, "conversations", chatId, "messages"), orderBy("createdAt", "asc"));

        unsubscribeMessages = onSnapshot(
          messagesQuery,
          (snapshot) => {
            const data = snapshot.docs.map((document) => ({
              id: document.id,
              ...document.data(),
            })) as Message[];

            setMessages(data);
            setLoading(false);
            requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
          },
          (error) => {
            console.error("Error cargando mensajes:", error);
            toast.error("Error cargando mensajes");
            setLoading(false);
          }
        );
      } catch (error) {
        console.error("Error en chat:", error);
        toast.error("Error en chat");
        setLoading(false);
      }
    }

    loadConversation();

    return () => unsubscribeMessages?.();
  }, [chatId]);

  async function sendMessage() {
    if (!text.trim()) return;

    if (!auth.currentUser) {
      toast.error("Debes iniciar sesión");
      return;
    }

    const messageText = text.trim();
    setText("");

    try {
      setSending(true);

      await addDoc(collection(db, "conversations", chatId, "messages"), {
        text: messageText,
        sender: currentUser,
        senderId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "conversations", chatId), {
        lastMessage: messageText,
        updatedAt: serverTimestamp(),
      });

      const receiverId = conversation?.sellerId === auth.currentUser.uid ? conversation?.buyerId : conversation?.sellerId;

      if (receiverId && receiverId !== auth.currentUser.uid) {
        await addDoc(collection(db, "notifications"), {
          userId: receiverId,
          title: "Nuevo mensaje",
          message: `${currentUser}: ${messageText}`,
          type: "message",
          read: false,
          link: `/chat/${chatId}`,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      toast.error("No se pudo enviar");
      setText(messageText);
    } finally {
      setSending(false);
    }
  }

  if (!auth.currentUser && !loading) {
    return (
      <>
        <TopBar />
        <main style={pageStyle}>
          <section style={emptyCard}>
            <span style={eyebrow}>Chat</span>
            <h1 style={emptyTitle}>Inicia sesión para conversar.</h1>
            <p style={emptyText}>Necesitas una cuenta para enviar mensajes a compradores o vendedores.</p>
            <Link href="/login" style={{ textDecoration: "none" }}>
              <button type="button" style={primaryButton}>Iniciar sesión</button>
            </Link>
          </section>
        </main>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <TopBar />

      <main className="fade-in" style={pageStyle}>
        <section style={chatShell}>
          <header style={headerStyle}>
            <Link href="/mensajes" className="back-button" style={backButton}>
              Volver
            </Link>
            <UserAvatar
              name={otherUserName}
              photoURL={otherUserPhoto}
              size={54}
              label={`Avatar de ${otherUserRole.toLowerCase()}`}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={roleText}>{otherUserRole}</p>
              <h1 style={chatTitle}>{conversation?.productTitle || "Conversación"}</h1>
              <p style={onlineText}>Chat en tiempo real · No compartas códigos ni anticipos</p>
            </div>
          </header>

          <div style={messagesContainer}>
            <div style={safetyBanner}>
              <strong>Compra y vende con precaución</strong>
              <span>No compartas códigos ni anticipos. Revisa el producto antes de pagar.</span>
            </div>

            {loading &&
              [1, 2, 3, 4].map((item) => (
                <div key={item} style={item % 2 === 0 ? skeletonRight : skeletonLeft}>
                  <div style={skeletonInner} />
                </div>
              ))}

            {!loading && messages.length === 0 && (
              <div style={emptyInline}>
                <SafeTradeNote compact title="Antes de cerrar trato" />
                <h2 style={emptyInlineTitle}>Inicia la conversación</h2>
                <p style={emptyText}>
                  Pregunta por estado, entrega y forma de pago. Mantén la conversación dentro de YaVendelo.
                </p>
              </div>
            )}

            {messages.map((message) => {
              const isMine = message.senderId === auth.currentUser?.uid;
              const messagePhoto = isMine
                ? currentPhotoURL
                : conversation?.sellerId === message.senderId
                  ? conversation?.sellerPhotoURL
                  : conversation?.buyerPhotoURL;

              return (
                <div key={message.id} style={{ ...messageRow, alignSelf: isMine ? "flex-end" : "flex-start" }}>
                  {!isMine && <UserAvatar name={message.sender} photoURL={messagePhoto} size={34} />}
                  <div style={{ maxWidth: "78%" }}>
                    <div style={isMine ? myBubble : otherBubble}>{message.text}</div>
                    <div style={{ ...metaText, textAlign: isMine ? "right" : "left" }}>
                      {isMine ? "Tú" : message.sender}
                      {formatMessageTime(message.createdAt) ? ` · ${formatMessageTime(message.createdAt)}` : ""}
                    </div>
                  </div>
                  {isMine && <UserAvatar name={currentUser} photoURL={messagePhoto} size={34} />}
                </div>
              );
            })}

            <div ref={bottomRef} />
          </div>

          <footer style={inputContainer}>
            <div style={inputWrap}>
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") sendMessage();
                }}
                placeholder="Escribe un mensaje seguro..."
                aria-label="Mensaje"
                style={inputStyle}
              />
              <span style={inputHint}>Evita códigos, contraseñas o anticipos.</span>
            </div>
            <button type="button" onClick={sendMessage} disabled={sending || !text.trim()} style={{ ...sendButton, opacity: sending || !text.trim() ? 0.7 : 1 }}>
              {sending ? "..." : "Enviar"}
            </button>
          </footer>
        </section>

        <BottomNav />
        <style jsx>{`
          @media (max-width: 720px) {
            .back-button {
              width: 100% !important;
              order: -2;
            }
          }
        `}</style>
      </main>
    </>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, rgba(255,123,0,0.08), transparent 380px), #070707",
  color: "white",
  padding: "42px 18px 120px",
};

const chatShell: React.CSSProperties = {
  maxWidth: "960px",
  margin: "0 auto",
  height: "calc(100vh - 190px)",
  minHeight: "560px",
  display: "flex",
  flexDirection: "column",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background:
    "linear-gradient(135deg, rgba(255,123,0,0.08), transparent 42%), linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.035))",
  overflow: "hidden",
  boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
};

const headerStyle: React.CSSProperties = {
  padding: "18px",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
  display: "flex",
  alignItems: "center",
  gap: "14px",
  background: "rgba(0,0,0,0.22)",
};

const backButton: React.CSSProperties = {
  minHeight: "42px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.06)",
  color: "#ffffff",
  padding: "0 13px",
  fontSize: "13px",
  fontWeight: "900",
  textDecoration: "none",
};

const roleText: React.CSSProperties = {
  margin: "0 0 4px",
  color: "#ffb067",
  fontSize: "12px",
  fontWeight: "900",
  textTransform: "uppercase",
};

const chatTitle: React.CSSProperties = {
  margin: "0 0 4px",
  fontSize: "22px",
  fontWeight: "900",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const onlineText: React.CSSProperties = {
  margin: 0,
  color: "#a7a7a7",
  fontWeight: "800",
};

const messagesContainer: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "22px",
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

const safetyBanner: React.CSSProperties = {
  display: "grid",
  gap: "4px",
  border: "1px solid rgba(255,123,0,0.24)",
  background: "rgba(255,123,0,0.1)",
  color: "#ffd2a3",
  borderRadius: "8px",
  padding: "13px 14px",
  fontSize: "13px",
  lineHeight: 1.5,
};

const bubbleBase: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: "8px",
  lineHeight: 1.5,
  wordBreak: "break-word",
};

const messageRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  gap: "8px",
  maxWidth: "88%",
};

const myBubble: React.CSSProperties = {
  ...bubbleBase,
  background: "linear-gradient(135deg, #ffb067, #ff7b00)",
  color: "#101010",
  fontWeight: "800",
};

const otherBubble: React.CSSProperties = {
  ...bubbleBase,
  background: "rgba(255,255,255,0.09)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "white",
};

const metaText: React.CSSProperties = {
  marginTop: "6px",
  padding: "0 4px",
  color: "#8d8d8d",
  fontSize: "12px",
};

const skeletonLeft: React.CSSProperties = {
  width: "45%",
  minHeight: "54px",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.08)",
  padding: "14px",
};

const skeletonRight: React.CSSProperties = {
  ...skeletonLeft,
  width: "64%",
  alignSelf: "flex-end",
};

const skeletonInner: React.CSSProperties = {
  width: "76%",
  height: "14px",
  borderRadius: "8px",
  background: "linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.12), rgba(255,255,255,0.05))",
  backgroundSize: "200% 100%",
  animation: "pulsePremium 1.8s ease-in-out infinite",
};

const inputContainer: React.CSSProperties = {
  padding: "16px",
  borderTop: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(0,0,0,0.24)",
  display: "flex",
  gap: "10px",
};

const inputWrap: React.CSSProperties = {
  flex: 1,
  display: "grid",
  gap: "7px",
};

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "#101010",
  color: "white",
  outline: "none",
  borderRadius: "8px",
  padding: "14px 15px",
  fontSize: "15px",
};

const inputHint: React.CSSProperties = {
  color: "#8f8f8f",
  fontSize: "12px",
  fontWeight: "800",
};

const sendButton: React.CSSProperties = {
  border: "none",
  borderRadius: "8px",
  padding: "0 18px",
  background: "linear-gradient(135deg, #ffb067, #ff7b00)",
  color: "#101010",
  fontWeight: "900",
  cursor: "pointer",
  minWidth: "104px",
};

const emptyCard: React.CSSProperties = {
  maxWidth: "680px",
  margin: "0 auto",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  padding: "46px 24px",
  textAlign: "center",
};

const eyebrow: React.CSSProperties = {
  display: "inline-flex",
  borderRadius: "8px",
  border: "1px solid rgba(255,123,0,0.22)",
  background: "rgba(255,123,0,0.12)",
  color: "#ffb067",
  padding: "9px 12px",
  fontWeight: "900",
  marginBottom: "14px",
};

const emptyTitle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: "34px",
  fontWeight: "900",
};

const emptyInline: React.CSSProperties = {
  margin: "auto",
  textAlign: "center",
};

const emptyInlineTitle: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: "26px",
  fontWeight: "900",
};

const emptyText: React.CSSProperties = {
  maxWidth: "520px",
  margin: "0 auto 24px",
  color: "#bdbdbd",
  lineHeight: 1.7,
};

const primaryButton: React.CSSProperties = {
  border: "none",
  background: "linear-gradient(135deg, #ffb067, #ff7b00)",
  color: "#101010",
  padding: "15px 18px",
  borderRadius: "8px",
  fontWeight: "900",
  cursor: "pointer",
};
