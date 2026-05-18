"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import { auth, db } from "@/app/firebase/config";
import AuthButtons from "./AuthButtons";

export default function TopBar() {
  const [user, setUser] = useState<User | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) setUnreadCount(0);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setUnreadCount(snapshot.size);
      },
      (error) => {
        console.warn("No se pudieron cargar notificaciones:", error);
        setUnreadCount(0);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return (
    <header style={headerStyle}>
      <div style={containerStyle}>
        <div style={leftStyle}>
          <Link href="/" style={{ textDecoration: "none", color: "white" }}>
            <div style={logoStyle}>YaVendelo</div>
          </Link>

          <nav style={navStyle}>
            <Link href="/" style={navLink}>Inicio</Link>
            <Link href="/publicar" style={navLink}>Publicar</Link>
            <Link href="/mensajes" style={navLink}>Mensajes</Link>
            <Link href="/favoritos" style={navLink}>Favoritos</Link>
          </nav>
        </div>

        <div style={rightStyle}>
          <Link href="/#productos" className="top-search-box" style={searchBox}>
            Buscar productos
          </Link>

          <Link href="/notificaciones" style={notificationButton} aria-label="Notificaciones">
            <span aria-hidden="true">🔔</span>
            {unreadCount > 0 && (
              <span style={badgeStyle}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          <AuthButtons />
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 980px) {
          nav {
            display: none !important;
          }
        }

        @media (max-width: 760px) {
          .top-search-box {
            display: none !important;
          }
        }

        @media (max-width: 520px) {
          header {
            display: none !important;
          }
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
  background: "rgba(5,5,5,0.82)",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "1240px",
  margin: "0 auto",
  padding: "14px 24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "20px",
};

const leftStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "22px",
};

const logoStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "900",
  letterSpacing: "0",
  whiteSpace: "nowrap",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "18px",
};

const navLink: React.CSSProperties = {
  textDecoration: "none",
  color: "#c7c7c7",
  fontWeight: "800",
  fontSize: "14px",
};

const rightStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const notificationButton: React.CSSProperties = {
  position: "relative",
  textDecoration: "none",
  color: "white",
  width: "44px",
  height: "44px",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
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
  minHeight: "44px",
  minWidth: "220px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  padding: "0 14px",
  color: "#a7a7a7",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "800",
};
