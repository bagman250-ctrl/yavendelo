"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";

import { auth, db } from "@/app/firebase/config";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";

type Message = {
  id: string;
  text: string;
  sender: string;
  senderId?: string;
};

type Conversation = {
  id: string;
  productTitle?: string;
  buyerId?: string;
  sellerId?: string;
};

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const chatId = params.id;
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const currentUser = useMemo(
    () => auth.currentUser?.displayName || auth.currentUser?.email || "Usuario",
    []
  );

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
            <div style={avatar}>{currentUser.charAt(0).toUpperCase()}</div>
            <div>
              <h1 style={chatTitle}>{conversation?.productTitle || "Conversación"}</h1>
              <p style={onlineText}>Chat en tiempo real</p>
            </div>
          </header>

          <div style={messagesContainer}>
            {loading && [1, 2, 3, 4].map((item) => <div key={item} style={item % 2 === 0 ? skeletonRight : skeletonLeft} />)}

            {!loading && messages.length === 0 && (
              <div style={emptyInline}>
                <h2 style={emptyInlineTitle}>Inicia la conversación</h2>
                <p style={emptyText}>Escribe el primer mensaje para resolver dudas sobre el producto.</p>
              </div>
            )}

            {messages.map((message) => {
              const isMine = message.senderId === auth.currentUser?.uid;

              return (
                <div key={message.id} style={{ alignSelf: isMine ? "flex-end" : "flex-start", maxWidth: "78%" }}>
                  <div style={isMine ? myBubble : otherBubble}>{message.text}</div>
                  <div style={{ ...metaText, textAlign: isMine ? "right" : "left" }}>{isMine ? "Tú" : message.sender}</div>
                </div>
              );
            })}

            <div ref={bottomRef} />
          </div>

          <footer style={inputContainer}>
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") sendMessage();
              }}
              placeholder="Escribe un mensaje..."
              style={inputStyle}
            />
            <button type="button" onClick={sendMessage} disabled={sending} style={{ ...sendButton, opacity: sending ? 0.7 : 1 }}>
              {sending ? "..." : "Enviar"}
            </button>
          </footer>
        </section>

        <BottomNav />
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
  background: "rgba(255,255,255,0.05)",
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

const avatar: React.CSSProperties = {
  width: "52px",
  height: "52px",
  borderRadius: "8px",
  background: "#ff7b00",
  color: "#101010",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "900",
  fontSize: "22px",
};

const chatTitle: React.CSSProperties = {
  margin: "0 0 4px",
  fontSize: "22px",
  fontWeight: "900",
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

const bubbleBase: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: "8px",
  lineHeight: 1.5,
  wordBreak: "break-word",
};

const myBubble: React.CSSProperties = {
  ...bubbleBase,
  background: "#ff7b00",
  color: "#101010",
  fontWeight: "800",
};

const otherBubble: React.CSSProperties = {
  ...bubbleBase,
  background: "rgba(255,255,255,0.08)",
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
  height: "54px",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.08)",
};

const skeletonRight: React.CSSProperties = {
  ...skeletonLeft,
  width: "64%",
  alignSelf: "flex-end",
};

const inputContainer: React.CSSProperties = {
  padding: "16px",
  borderTop: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(0,0,0,0.24)",
  display: "flex",
  gap: "10px",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "#101010",
  color: "white",
  outline: "none",
  borderRadius: "8px",
  padding: "14px 15px",
  fontSize: "15px",
};

const sendButton: React.CSSProperties = {
  border: "none",
  borderRadius: "8px",
  padding: "0 18px",
  background: "#ff7b00",
  color: "#101010",
  fontWeight: "900",
  cursor: "pointer",
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
  background: "#ff7b00",
  color: "#101010",
  padding: "15px 18px",
  borderRadius: "8px",
  fontWeight: "900",
  cursor: "pointer",
};
