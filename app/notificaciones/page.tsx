"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDocs, onSnapshot, orderBy, query, updateDoc, where, writeBatch } from "firebase/firestore";

import { auth, db } from "@/app/firebase/config";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import { hideEmailsFromNotification } from "@/lib/notificationActors";

type NotificationItem = {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  read?: boolean;
  link?: string;
};

function getNotificationLabel(type?: string) {
  if (type === "message") return "Mensaje";
  if (type === "favorite") return "Favorito";
  if (type === "product") return "Producto";
  if (type === "system") return "Sistema";
  return "Actividad";
}

export default function NotificacionesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setCheckingAuth(false);

      if (!firebaseUser) {
        setNotifications([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        })) as NotificationItem[];

        setNotifications(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error cargando notificaciones:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  async function markAsRead(notificationId: string, alreadyRead?: boolean) {
    if (alreadyRead) return;

    try {
      await updateDoc(doc(db, "notifications", notificationId), { read: true });
    } catch (error) {
      console.error("Error marcando notificación:", error);
    }
  }

  async function markAllAsRead() {
    if (!user || unreadCount === 0) return;

    try {
      setMarkingAll(true);
      const unreadQuery = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        where("read", "==", false)
      );

      const snapshot = await getDocs(unreadQuery);
      const batch = writeBatch(db);

      snapshot.docs.forEach((document) => {
        batch.update(doc(db, "notifications", document.id), { read: true });
      });

      await batch.commit();
    } catch (error) {
      console.error("Error marcando todas:", error);
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <>
      <TopBar />

      <main className="fade-in" style={pageStyle}>
        <section style={containerStyle}>
          <div style={headerStyle}>
            <div>
              <span style={eyebrow}>Centro de actividad</span>
              <h1 style={titleStyle}>Notificaciones</h1>
              <p style={subtitleStyle}>Mensajes, favoritos, reportes y avisos importantes de tu cuenta beta.</p>
            </div>

            {user && unreadCount > 0 && (
              <button type="button" onClick={markAllAsRead} disabled={markingAll} style={secondaryButton}>
                {markingAll ? "Marcando..." : "Marcar todo como leído"}
              </button>
            )}
          </div>

          {(checkingAuth || loading) && (
            <div style={listStyle}>
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} style={skeletonCard} />
              ))}
            </div>
          )}

          {!checkingAuth && !user && (
            <EmptyState
              label="Notificaciones"
              title="Inicia sesión para ver tu actividad."
              text="Necesitas una cuenta para recibir mensajes, avisos y seguimiento de tus productos."
              action={<Link href="/login" style={{ textDecoration: "none" }}><button type="button" style={primaryButton}>Iniciar sesión</button></Link>}
            />
          )}

          {!checkingAuth && user && !loading && notifications.length === 0 && (
            <EmptyState
              label="Sin actividad"
              title="Todo tranquilo por ahora."
              text="Cuando tengas mensajes, favoritos o avisos nuevos, aparecerán aquí. No hay acciones pendientes."
            />
          )}

          {!checkingAuth && user && !loading && notifications.length > 0 && (
            <div style={listStyle}>
              {notifications.map((notification) => {
                const content = (
                  <article
                    onClick={() => markAsRead(notification.id, notification.read)}
                    style={notification.read ? notificationCard : unreadNotificationCard}
                  >
                    <span style={typeBadge}>{getNotificationLabel(notification.type)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 style={notificationTitle}>{notification.title || "Nueva notificación"}</h2>
                      <p style={notificationText}>{hideEmailsFromNotification(notification.message || "Tienes actividad nueva.")}</p>
                    </div>
                    {!notification.read && <span style={unreadDot} />}
                  </article>
                );

                return notification.link ? (
                  <Link key={notification.id} href={notification.link} style={{ textDecoration: "none" }}>
                    {content}
                  </Link>
                ) : (
                  <div key={notification.id}>{content}</div>
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

function EmptyState({
  label,
  title,
  text,
  action,
}: {
  label: string;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={emptyCard}>
      <span style={eyebrow}>{label}</span>
      <h2 style={emptyTitle}>{title}</h2>
      <p style={emptyText}>{text}</p>
      {action}
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
  maxWidth: "920px",
  margin: "0 auto",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "end",
  gap: "18px",
  flexWrap: "wrap",
  marginBottom: "24px",
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
  fontWeight: "900",
};

const subtitleStyle: React.CSSProperties = {
  color: "#bdbdbd",
  lineHeight: 1.7,
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: "12px",
};

const notificationCard: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.035))",
  padding: "18px",
  color: "white",
  cursor: "pointer",
};

const unreadNotificationCard: React.CSSProperties = {
  ...notificationCard,
  border: "1px solid rgba(255,123,0,0.28)",
  background: "rgba(255,123,0,0.1)",
};

const typeBadge: React.CSSProperties = {
  flexShrink: 0,
  borderRadius: "8px",
  background: "rgba(255,255,255,0.08)",
  color: "#ffb067",
  padding: "8px 10px",
  fontSize: "12px",
  fontWeight: "900",
};

const notificationTitle: React.CSSProperties = {
  margin: "0 0 6px",
  fontSize: "19px",
  fontWeight: "900",
};

const notificationText: React.CSSProperties = {
  margin: 0,
  color: "#bdbdbd",
  lineHeight: 1.5,
};

const unreadDot: React.CSSProperties = {
  width: "10px",
  height: "10px",
  borderRadius: "999px",
  background: "#ff7b00",
  boxShadow: "0 0 14px rgba(255,123,0,0.85)",
};

const skeletonCard: React.CSSProperties = {
  height: "96px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)",
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

const secondaryButton: React.CSSProperties = {
  ...primaryButton,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
};
