"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import { auth, db } from "@/app/firebase/config";
import UserAvatar from "./UserAvatar";

export default function BottomNav() {
  const [user, setUser] = useState<User | null>(null);
  const [notificationsCount, setNotificationsCount] = useState(0);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) setNotificationsCount(0);
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

    const unsubscribeNotifications = onSnapshot(
      q,
      (snapshot) => {
        setNotificationsCount(snapshot.size);
      },
      (error) => {
        console.warn("No se pudieron cargar notificaciones:", error);
        setNotificationsCount(0);
      }
    );

    return () => unsubscribeNotifications();
  }, [user]);

  return (
    <>
      <nav style={navStyle} aria-label="Navegación principal móvil">
        <Link href="/" style={link}>
          <div style={icon}>⌂</div>
          <span style={text}>Inicio</span>
        </Link>

        <Link href="/favoritos" style={link}>
          <div style={icon}>♡</div>
          <span style={text}>Favoritos</span>
        </Link>

        <Link href="/publicar" style={{ ...link, transform: "translateY(-22px)" }} aria-label="Publicar">
          <div style={plusButton}>+</div>
        </Link>

        <Link href="/mensajes" style={link}>
          <div style={{ position: "relative" }}>
            <div style={icon}>◌</div>
            {notificationsCount > 0 && (
              <div style={badge}>
                {notificationsCount > 9 ? "9+" : notificationsCount}
              </div>
            )}
          </div>
          <span style={text}>Mensajes</span>
        </Link>

        <Link href="/perfil" style={link}>
          {user ? (
            <UserAvatar
              name={user.displayName}
              email={user.email}
              photoURL={user.photoURL}
              size={30}
              label="Perfil"
            />
          ) : (
            <div style={icon}>◎</div>
          )}
          <span style={text}>Perfil</span>
        </Link>
      </nav>

      <style jsx>{`
        @media (min-width: 769px) {
          nav {
            display: none !important;
          }
        }

        @media (max-width: 420px) {
          nav {
            width: calc(100% - 20px) !important;
            padding-left: 8px !important;
            padding-right: 8px !important;
          }
        }
      `}</style>
    </>
  );
}

const navStyle: React.CSSProperties = {
  position: "fixed",
  bottom: "calc(12px + env(safe-area-inset-bottom))",
  left: "50%",
  transform: "translateX(-50%)",
  width: "calc(100% - 28px)",
  maxWidth: "520px",
  background: "rgba(15,15,15,0.92)",
  backdropFilter: "blur(18px)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  padding: "11px 10px",
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  zIndex: 9999,
  boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
};

const link: React.CSSProperties = {
  textDecoration: "none",
  color: "white",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "5px",
  fontSize: "12px",
  fontWeight: "800",
  minWidth: "52px",
};

const icon: React.CSSProperties = {
  width: "30px",
  height: "30px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
  lineHeight: 1,
};

const text: React.CSSProperties = {
  opacity: 0.88,
};

const plusButton: React.CSSProperties = {
  width: "58px",
  height: "58px",
  borderRadius: "8px",
  background: "linear-gradient(135deg, #ffb067, #ff7b00)",
  color: "#101010",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "34px",
  fontWeight: "900",
  boxShadow: "0 10px 30px rgba(255,123,0,0.35)",
};

const badge: React.CSSProperties = {
  position: "absolute",
  top: "-8px",
  right: "-12px",
  minWidth: "20px",
  height: "20px",
  borderRadius: "999px",
  background: "#ff3b30",
  color: "white",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "11px",
  fontWeight: "900",
  padding: "0 6px",
};
