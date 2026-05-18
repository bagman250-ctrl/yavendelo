"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import toast from "react-hot-toast";

import { auth, db } from "@/app/firebase/config";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";

type Conversation = {
  id: string;
  lastMessage?: string;
  unread?: boolean;
  productTitle?: string;
  buyerId?: string;
  sellerId?: string;
  buyerName?: string;
  sellerName?: string;
};

export default function MensajesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeMessages: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (unsubscribeMessages) {
        unsubscribeMessages();
        unsubscribeMessages = undefined;
      }

      if (!firebaseUser) {
        setConversations([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const conversationsQuery = query(
        collection(db, "conversations"),
        where("participants", "array-contains", firebaseUser.uid),
        orderBy("updatedAt", "desc")
      );

      unsubscribeMessages = onSnapshot(
        conversationsQuery,
        (snapshot) => {
          const data = snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          })) as Conversation[];

          setConversations(data);
          setLoading(false);
        },
        (error) => {
          console.error("Error cargando conversaciones:", error);
          toast.error("Error cargando conversaciones");
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeMessages?.();
      unsubscribeAuth();
    };
  }, []);

  if (loading) return <main style={centerPage}>Cargando mensajes...</main>;

  if (!user) {
    return (
      <>
        <TopBar />
        <main style={pageStyle}>
          <section style={emptyCard}>
            <span style={eyebrow}>Mensajes</span>
            <h1 style={emptyTitle}>Inicia sesión para ver tus conversaciones.</h1>
            <p style={emptyText}>Los mensajes entre compradores y vendedores aparecerán en esta bandeja.</p>
            <Link href="/login" style={{ textDecoration: "none" }}>
              <button type="button" style={primaryButton}>
                Iniciar sesión
              </button>
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
        <section style={containerStyle}>
          <div style={headerStyle}>
            <span style={eyebrow}>Mensajes</span>
            <h1 style={titleStyle}>Conversaciones</h1>
            <p style={subtitleStyle}>Gestiona preguntas, acuerdos y seguimiento de tus compras o ventas.</p>
          </div>

          {conversations.length === 0 ? (
            <div style={emptyCard}>
              <span style={eyebrow}>Sin conversaciones</span>
              <h2 style={emptyTitle}>Todavía no hay mensajes.</h2>
              <p style={emptyText}>Cuando alguien te escriba, aparecerá aquí con el producto relacionado.</p>
              <Link href="/" style={{ textDecoration: "none" }}>
                <button type="button" style={primaryButton}>
                  Explorar productos
                </button>
              </Link>
            </div>
          ) : (
            <div style={listStyle}>
              {conversations.map((conversation) => {
                const otherUser = conversation.buyerId === user.uid ? conversation.sellerName : conversation.buyerName;

                return (
                  <Link key={conversation.id} href={`/chat/${conversation.id}`} style={{ textDecoration: "none" }}>
                    <article style={conversationCard}>
                      <div style={avatar}>{otherUser?.charAt(0).toUpperCase() || "U"}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={conversationTop}>
                          <h2 style={userName}>{otherUser || "Usuario"}</h2>
                          {conversation.unread && <span style={unreadBadge}>Nuevo</span>}
                        </div>
                        {conversation.productTitle && <span style={productBadge}>{conversation.productTitle}</span>}
                        <p style={messageStyle}>{conversation.lastMessage || "Sin mensajes todavía"}</p>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
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
  padding: "42px 24px 140px",
};

const centerPage: React.CSSProperties = {
  ...pageStyle,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontWeight: "900",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "960px",
  margin: "0 auto",
};

const headerStyle: React.CSSProperties = {
  marginBottom: "28px",
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

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "48px",
  lineHeight: 1.05,
  fontWeight: "900",
};

const subtitleStyle: React.CSSProperties = {
  color: "#bdbdbd",
  lineHeight: 1.7,
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: "14px",
};

const conversationCard: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  padding: "18px",
  color: "white",
};

const avatar: React.CSSProperties = {
  width: "58px",
  height: "58px",
  borderRadius: "8px",
  background: "#ff7b00",
  color: "#101010",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "900",
  fontSize: "22px",
  flexShrink: 0,
};

const conversationTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "center",
};

const userName: React.CSSProperties = {
  margin: 0,
  fontSize: "20px",
  fontWeight: "900",
};

const productBadge: React.CSSProperties = {
  display: "inline-flex",
  marginTop: "8px",
  borderRadius: "8px",
  background: "rgba(255,123,0,0.12)",
  color: "#ffb067",
  padding: "7px 9px",
  fontSize: "12px",
  fontWeight: "900",
};

const messageStyle: React.CSSProperties = {
  margin: "10px 0 0",
  color: "#a7a7a7",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const unreadBadge: React.CSSProperties = {
  borderRadius: "8px",
  background: "#ff3b30",
  color: "white",
  padding: "6px 8px",
  fontSize: "12px",
  fontWeight: "900",
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

const emptyTitle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: "34px",
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
