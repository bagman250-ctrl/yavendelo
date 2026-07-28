"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, onAuthStateChanged } from "firebase/auth";

import { auth } from "@/app/firebase/config";
import UserAvatar from "./UserAvatar";

export default function BottomNav() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <>
      <nav style={navStyle} aria-label="Navegacion principal movil">
        <Link href="/" style={link}>
          <HomeIcon />
          <span style={text}>Inicio</span>
        </Link>

        <Link href="/#productos" style={link}>
          <SearchIcon />
          <span style={text}>Buscar</span>
        </Link>

        <Link href="/publicar" style={{ ...link, transform: "translateY(-22px)" }} aria-label="Publicar">
          <div style={plusButton}>+</div>
        </Link>

        <Link href="/favoritos" style={link}>
          <HeartIcon />
          <span style={text}>Favoritos</span>
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
            <ProfileIcon />
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

function HomeIcon() {
  return (
    <span style={icon} aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M4 11.2 12 4l8 7.2V20h-5v-5.2H9V20H4v-8.8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function SearchIcon() {
  return (
    <span style={icon} aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" />
        <path d="m16 16 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function HeartIcon() {
  return (
    <span style={icon} aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function ProfileIcon() {
  return (
    <span style={icon} aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
        <path d="M4.5 20a7.5 7.5 0 0 1 15 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
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
  borderRadius: "18px",
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
  fontSize: "11px",
  fontWeight: "800",
  minWidth: "52px",
};

const icon: React.CSSProperties = {
  width: "30px",
  height: "30px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  color: "#ffb067",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
};

const text: React.CSSProperties = {
  opacity: 0.88,
};

const plusButton: React.CSSProperties = {
  width: "58px",
  height: "58px",
  borderRadius: "18px",
  background: "linear-gradient(135deg, #ffb067, #ff8a00)",
  color: "#101010",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "34px",
  fontWeight: "900",
  boxShadow: "0 10px 30px rgba(255,138,0,0.35)",
};
