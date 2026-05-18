"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import toast from "react-hot-toast";

import { auth, db } from "@/app/firebase/config";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import UserAvatar from "@/components/UserAvatar";

type DateLike = { seconds?: number } | number | string;

type Conversation = {
  id: string;
  lastMessage?: string;
  unread?: boolean;
  productTitle?: string;
  updatedAt?: DateLike;
  buyerId?: string;
  sellerId?: string;
  buyerName?: string;
  sellerName?: string;
  buyerPhotoURL?: string;
  sellerPhotoURL?: string;
};

function getDateValue(value?: DateLike) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return Number(value?.seconds || 0);
}

function formatConversationDate(value?: DateLike) {
  const rawValue = getDateValue(value);
  if (!rawValue) return "Reciente";

  const millis = rawValue < 10000000000 ? rawValue * 1000 : rawValue;
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(millis));
}

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

  if (loading) {
    return (
      <>
        <TopBar />
        <main style={pageStyle}>
          <section style={containerStyle}>
            <div style={headerStyle}>
              <span style={eyebrow}>Mensajes</span>
              <h1 style={titleStyle}>Conversaciones</h1>
              <p style={subtitleStyle}>Cargando tus chats de compra y venta...</p>
            </div>
            <MessagesSkeleton />
          </section>
        </main>
        <BottomNav />
      </>
    );
  }

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
            <div>
              <span style={eyebrow}>Mensajes</span>
              <h1 style={titleStyle}>Conversaciones</h1>
              <p style={subtitleStyle}>Gestiona preguntas, acuerdos y seguimiento de tus compras o ventas.</p>
            </div>
            <div style={securityPill}>No compartas códigos ni anticipos</div>
          </div>

          {conversations.length === 0 ? (
            <div style={emptyCard}>
              <span style={eyebrow}>Sin conversaciones</span>
              <h2 style={emptyTitle}>Todavía no hay mensajes.</h2>
              <p style={emptyText}>
                Cuando alguien te escriba, aparecerá aquí con el producto relacionado. Mantén los acuerdos dentro del chat
                y evita compartir códigos, depósitos o anticipos.
              </p>
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
                const otherPhoto =
                  conversation.buyerId === user.uid ? conversation.sellerPhotoURL : conversation.buyerPhotoURL;
                const otherRole = conversation.buyerId === user.uid ? "Vendedor" : "Comprador";

                return (
                  <Link key={conversation.id} href={`/chat/${conversation.id}`} style={{ textDecoration: "none" }}>
                    <article className="conversation-card" style={conversationCard}>
                      <UserAvatar name={otherUser} photoURL={otherPhoto} size={60} label={`Avatar de ${otherRole.toLowerCase()}`} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={conversationTop}>
                          <div style={{ minWidth: 0 }}>
                            <h2 style={userName}>{otherUser || "Usuario"}</h2>
                            <p style={roleText}>{otherRole} · {formatConversationDate(conversation.updatedAt)}</p>
                          </div>
                          <div style={rightMeta}>
                            {conversation.unread && <span style={unreadBadge}>Nuevo</span>}
                            <span style={chevronStyle}>Abrir</span>
                          </div>
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
        <style jsx>{`
          .conversation-card:hover {
            transform: translateY(-2px);
            border-color: rgba(255, 123, 0, 0.34) !important;
            box-shadow: 0 18px 46px rgba(0, 0, 0, 0.28);
          }

          @media (max-width: 720px) {
            .conversation-card {
              align-items: flex-start !important;
              padding: 16px !important;
            }
          }
        `}</style>
      </main>
    </>
  );
}

function MessagesSkeleton() {
  return (
    <div style={listStyle}>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} style={skeletonCard}>
          <div style={skeletonAvatar} />
          <div style={{ flex: 1 }}>
            <div style={{ ...skeletonLine, width: "44%", height: "20px" }} />
            <div style={{ ...skeletonLine, width: "68%" }} />
            <div style={{ ...skeletonLine, width: index % 2 === 0 ? "86%" : "58%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, rgba(255,123,0,0.08), transparent 380px), #070707",
  color: "white",
  padding: "42px 24px 140px",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "980px",
  margin: "0 auto",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "18px",
  flexWrap: "wrap",
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
  maxWidth: "620px",
  color: "#bdbdbd",
  lineHeight: 1.7,
};

const securityPill: React.CSSProperties = {
  border: "1px solid rgba(255,123,0,0.24)",
  background: "rgba(255,123,0,0.1)",
  color: "#ffd2a3",
  borderRadius: "8px",
  padding: "11px 12px",
  fontSize: "13px",
  fontWeight: "900",
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
  background:
    "linear-gradient(135deg, rgba(255,123,0,0.08), transparent 42%), linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.035))",
  padding: "18px",
  color: "white",
  transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
};

const conversationTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "flex-start",
};

const userName: React.CSSProperties = {
  margin: 0,
  fontSize: "20px",
  fontWeight: "900",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const roleText: React.CSSProperties = {
  margin: "5px 0 0",
  color: "#8f8f8f",
  fontSize: "12px",
  fontWeight: "900",
};

const rightMeta: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexShrink: 0,
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
  color: "#c2c2c2",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const unreadBadge: React.CSSProperties = {
  borderRadius: "8px",
  background: "linear-gradient(135deg, #ffb067, #ff7b00)",
  color: "#101010",
  padding: "6px 8px",
  fontSize: "12px",
  fontWeight: "900",
};

const chevronStyle: React.CSSProperties = {
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "#d7d7d7",
  padding: "6px 8px",
  fontSize: "12px",
  fontWeight: "900",
};

const emptyCard: React.CSSProperties = {
  maxWidth: "680px",
  margin: "0 auto",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.035))",
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
  background: "linear-gradient(135deg, #ffb067, #ff7b00)",
  color: "#101010",
  padding: "15px 18px",
  borderRadius: "8px",
  fontWeight: "900",
  cursor: "pointer",
};

const skeletonCard: React.CSSProperties = {
  ...conversationCard,
  pointerEvents: "none",
};

const skeletonAvatar: React.CSSProperties = {
  width: "60px",
  height: "60px",
  borderRadius: "8px",
  background: "linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.12), rgba(255,255,255,0.05))",
  backgroundSize: "200% 100%",
  animation: "pulsePremium 1.8s ease-in-out infinite",
  flexShrink: 0,
};

const skeletonLine: React.CSSProperties = {
  height: "14px",
  marginBottom: "12px",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.1)",
};
