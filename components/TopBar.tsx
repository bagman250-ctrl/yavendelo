"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, onAuthStateChanged } from "firebase/auth";
import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";

import { auth, db } from "@/app/firebase/config";
import AuthButtons from "./AuthButtons";

type NotificationPreview = {
  id: string;
  title?: string;
  message?: string;
  read?: boolean;
  link?: string;
  type?: string;
};

export default function TopBar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationPreview[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setUnreadCount(0);
        setNotifications([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unreadQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("read", "==", false)
    );

    const unsubscribeUnread = onSnapshot(
      unreadQuery,
      (snapshot) => {
        setUnreadCount(snapshot.size);
      },
      (error) => {
        console.warn("No se pudieron cargar notificaciones:", error);
        setUnreadCount(0);
      }
    );

    const previewQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsubscribePreview = onSnapshot(
      previewQuery,
      (snapshot) => {
        setNotifications(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          })) as NotificationPreview[]
        );
      },
      (error) => {
        console.warn("No se pudieron cargar previews de notificaciones:", error);
        setNotifications([]);
      }
    );

    return () => {
      unsubscribeUnread();
      unsubscribePreview();
    };
  }, [user]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanSearch = search.trim();

    if (!cleanSearch) {
      router.push("/#productos");
      return;
    }

    router.push(`/?q=${encodeURIComponent(cleanSearch)}#productos`);
    window.dispatchEvent(new CustomEvent("yavendelo-search", { detail: cleanSearch }));
  }

  async function markNotificationRead(notification: NotificationPreview) {
    if (!notification.read) {
      await updateDoc(doc(db, "notifications", notification.id), { read: true }).catch((error) => {
        console.warn("No se pudo marcar notificación:", error);
      });
    }

    setNotificationsOpen(false);
  }

  return (
    <header style={headerStyle}>
      <div className="topbar-shell" style={containerStyle}>
        <div style={leftStyle}>
          <Link href="/" className="brand-link" style={{ textDecoration: "none", color: "white" }} aria-label="Ir al inicio">
            <div style={logoStyle}>
              <LogoIcon />
              <span className="brand-text" style={logoText}>YaVendelo</span>
            </div>
          </Link>

          <nav style={navStyle}>
            <Link href="/" style={navLink}>Inicio</Link>
            <Link href="/publicar" style={navLink}>Publicar</Link>
            <Link href="/mensajes" style={navLink}>Mensajes</Link>
            <Link href="/favoritos" style={navLink}>Favoritos</Link>
          </nav>
        </div>

        <div className="topbar-actions" style={rightStyle}>
          <div style={notificationWrap}>
            <button
              type="button"
              className="notification-bell"
              style={unreadCount > 0 ? activeNotificationButton : notificationButton}
              aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ""}`}
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen((current) => !current)}
            >
              <BellIcon active={unreadCount > 0} />
              {unreadCount > 0 && (
                <span style={badgeStyle}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div style={notificationsMenu}>
                <div style={notificationsMenuHeader}>
                  <strong>Notificaciones</strong>
                  <Link href="/notificaciones" style={menuTinyLink} onClick={() => setNotificationsOpen(false)}>
                    Ver todas
                  </Link>
                </div>

                {notifications.length === 0 ? (
                  <div style={notificationEmpty}>Todo tranquilo por ahora.</div>
                ) : (
                  notifications.map((notification) => (
                    <Link
                      key={notification.id}
                      href={notification.link || "/notificaciones"}
                      style={notificationItem}
                      onClick={() => markNotificationRead(notification)}
                    >
                      <span style={notificationDot(notification.read)} />
                      <span style={{ minWidth: 0 }}>
                        <strong>{notification.title || "Nueva actividad"}</strong>
                        <small>{notification.message || "Tienes una notificación nueva."}</small>
                      </span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          <AuthButtons />
        </div>

        <div className="topbar-search" style={searchSlot}>
          <form className="top-search-box" onSubmit={submitSearch} style={searchBox}>
            <SearchIcon />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar iPhone, moto, sala..."
              aria-label="Buscar productos"
              style={searchInput}
            />
            <button type="submit" aria-label="Buscar" style={searchSubmit}>
              Buscar
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1180px) {
          nav {
            display: none !important;
          }
        }

        @media (max-width: 1099px) {
          header :global(.topbar-shell) {
            grid-template-columns: 1fr auto !important;
            gap: 12px 18px !important;
          }

          header :global(.topbar-search) {
            grid-column: 1 / -1 !important;
            grid-row: 2 !important;
          }
        }

        @media (max-width: 767px) {
          .top-search-box {
            width: 100% !important;
            min-width: 100% !important;
          }

          header :global(.brand-text) {
            font-size: 20px !important;
          }

          header :global(.topbar-shell) {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }

        @media (max-width: 520px) {
          header :global(.topbar-shell) {
            grid-template-columns: minmax(0, 1fr) auto !important;
            gap: 10px 10px !important;
          }

          header :global(.brand-text) {
            font-size: 18px !important;
          }

          header :global(.topbar-search) {
            grid-column: 1 / -1 !important;
            grid-row: 2 !important;
          }

          header :global(.topbar-actions) {
            grid-column: 2 !important;
            grid-row: 1 !important;
            justify-content: flex-end !important;
            width: auto !important;
            gap: 7px !important;
          }
        }

        .brand-link:hover :global(.logo-icon) {
          transform: translateY(-1px) scale(1.03);
          box-shadow: 0 16px 38px rgba(255, 123, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.32);
        }

        .top-search-box:focus-within {
          border-color: rgba(255, 123, 0, 0.58) !important;
          box-shadow: 0 0 0 4px rgba(255, 123, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
        }

        .notification-bell:hover {
          transform: translateY(-1px);
          border-color: rgba(255, 123, 0, 0.38) !important;
          background: rgba(255, 123, 0, 0.12) !important;
        }

        .notification-bell[aria-expanded="true"] {
          border-color: rgba(255, 123, 0, 0.48) !important;
          background: rgba(255, 123, 0, 0.14) !important;
        }
      `}</style>
    </header>
  );
}

const headerStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 999,
  backdropFilter: "blur(16px)",
  background: "rgba(5,5,5,0.86)",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const containerStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "1440px",
  margin: "0 auto",
  padding: "12px 24px",
  display: "grid",
  gridTemplateColumns: "auto minmax(340px, 520px) auto",
  alignItems: "center",
  gap: "24px",
  boxSizing: "border-box",
};

const searchSlot: React.CSSProperties = {
  minWidth: 0,
  gridColumn: 2,
  gridRow: 1,
};

const rightStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  justifyContent: "flex-end",
  minWidth: 0,
  gridColumn: 3,
  gridRow: 1,
  justifySelf: "end",
};

const leftStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "22px",
  minWidth: 0,
  gridColumn: 1,
  gridRow: 1,
};

const logoStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  fontWeight: "900",
  letterSpacing: "0",
  whiteSpace: "nowrap",
};

const logoText: React.CSSProperties = {
  fontSize: "24px",
  letterSpacing: "0",
  background: "linear-gradient(180deg, #fff, #d9d9d9)",
  WebkitBackgroundClip: "text",
  color: "transparent",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  minWidth: 0,
};

const navLink: React.CSSProperties = {
  textDecoration: "none",
  color: "#c7c7c7",
  fontWeight: "800",
  fontSize: "14px",
  transition: "color 0.2s ease",
};

const notificationWrap: React.CSSProperties = {
  position: "relative",
  flexShrink: 0,
};

const notificationButton: React.CSSProperties = {
  position: "relative",
  color: "white",
  width: "46px",
  height: "46px",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
  cursor: "pointer",
  transition: "transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease",
};

const activeNotificationButton: React.CSSProperties = {
  ...notificationButton,
  border: "1px solid rgba(255,123,0,0.36)",
  background: "rgba(255,123,0,0.12)",
  boxShadow: "0 12px 30px rgba(255,123,0,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
};

const badgeStyle: React.CSSProperties = {
  position: "absolute",
  top: "-7px",
  right: "-7px",
  minWidth: "21px",
  height: "21px",
  padding: "0 6px",
  borderRadius: "999px",
  background: "#ff3b30",
  color: "white",
  fontSize: "11px",
  fontWeight: "900",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const searchBox: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  minHeight: "46px",
  width: "100%",
  minWidth: 0,
  overflow: "hidden",
  background: "linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.045))",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "8px",
  padding: "0 7px 0 13px",
  color: "#a7a7a7",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "800",
  gap: "8px",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
  transition: "border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
};

const searchInput: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  border: "none",
  outline: "none",
  background: "transparent",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "800",
};

const searchSubmit: React.CSSProperties = {
  minHeight: "34px",
  width: "84px",
  flex: "0 0 84px",
  border: "none",
  borderRadius: "8px",
  background: "rgba(255,123,0,0.14)",
  color: "#ffb067",
  padding: "0 10px",
  fontSize: "12px",
  fontWeight: "900",
  cursor: "pointer",
};

const notificationsMenu: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 10px)",
  right: 0,
  width: "min(340px, calc(100vw - 32px))",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(12,12,12,0.98)",
  backdropFilter: "blur(18px)",
  borderRadius: "8px",
  padding: "10px",
  display: "grid",
  gap: "8px",
  boxShadow: "0 24px 70px rgba(0,0,0,0.44)",
  zIndex: 1001,
};

const notificationsMenuHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  padding: "6px 6px 8px",
  color: "#ffffff",
};

const menuTinyLink: React.CSSProperties = {
  color: "#ffb067",
  fontSize: "12px",
  fontWeight: "900",
  textDecoration: "none",
};

const notificationItem: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  alignItems: "flex-start",
  color: "#ffffff",
  textDecoration: "none",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: "11px",
};

const notificationEmpty: React.CSSProperties = {
  borderRadius: "8px",
  background: "rgba(255,255,255,0.045)",
  color: "#bdbdbd",
  padding: "18px 12px",
  textAlign: "center",
  fontWeight: "800",
};

function notificationDot(read?: boolean): React.CSSProperties {
  return {
    width: "9px",
    height: "9px",
    borderRadius: "999px",
    marginTop: "5px",
    background: read ? "rgba(255,255,255,0.18)" : "#ff7b00",
    boxShadow: read ? "none" : "0 0 14px rgba(255,123,0,0.9)",
    flexShrink: 0,
  };
}

function BellIcon({ active }: { active: boolean }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 9.8C18 6.6 15.6 4 12.4 4h-.8C8.4 4 6 6.6 6 9.8v2.9c0 .8-.3 1.6-.9 2.2L4 16.1V18h16v-1.9l-1.1-1.2c-.6-.6-.9-1.4-.9-2.2V9.8Z"
        stroke={active ? "#ffb067" : "#d8d8d8"}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9.5 20a2.7 2.7 0 0 0 5 0" stroke={active ? "#ffb067" : "#d8d8d8"} strokeWidth="1.8" strokeLinecap="round" />
      {active && <circle cx="17.5" cy="5.5" r="2.2" fill="#ff3b30" />}
    </svg>
  );
}

function LogoIcon() {
  return (
    <span className="logo-icon" style={logoIconWrap} aria-hidden="true">
      <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
        <rect x="4.5" y="4.5" width="33" height="33" rx="10" fill="url(#yvGradient)" />
        <rect x="5.25" y="5.25" width="31.5" height="31.5" rx="9.25" stroke="white" strokeOpacity="0.18" strokeWidth="1.5" />
        <path
          d="M10.8 12.8h5.9l4.2 7.2 4.2-7.2h5.7L23.7 24v5.2h-5.5v-5.1L10.8 12.8Z"
          fill="#101010"
        />
        <path
          d="M26.6 12.8h5.8L26 29.2h-5.7l2.4-5.2 1.2-2.5 2.7-8.7Z"
          fill="#101010"
          opacity="0.92"
        />
        <path d="M13.2 12.8h3.5l4.2 7.2 4.2-7.2h3.6L21 25.1l-7.8-12.3Z" fill="#ffffff" opacity="0.96" />
        <path d="M27.3 12.8h3.6l-6.4 16.4h-3.6l6.4-16.4Z" fill="#ffffff" opacity="0.96" />
        <path d="M9.5 31.5h23" stroke="#101010" strokeOpacity="0.22" strokeWidth="2" strokeLinecap="round" />
        <defs>
          <linearGradient id="yvGradient" x1="5" y1="4" x2="37" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFC078" />
            <stop offset="0.45" stopColor="#FF7B00" />
            <stop offset="1" stopColor="#FF4D00" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}

const logoIconWrap: React.CSSProperties = {
  width: "42px",
  height: "42px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "10px",
  background: "rgba(255,123,0,0.08)",
  boxShadow: "0 14px 34px rgba(255,123,0,0.28), inset 0 1px 0 rgba(255,255,255,0.14)",
  transition: "transform 0.18s ease, box-shadow 0.18s ease",
  flexShrink: 0,
};

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m20 20-4.4-4.4" stroke="#ffb067" strokeWidth="2" strokeLinecap="round" />
      <circle cx="11" cy="11" r="6" stroke="#ffb067" strokeWidth="2" />
    </svg>
  );
}
