"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, signOut } from "firebase/auth";

import { auth } from "../app/firebase/config";
import UserAvatar from "./UserAvatar";

export default function AuthButtons() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  async function logout() {
    await signOut(auth);
    window.location.href = "/";
  }

  if (!user) {
    return (
      <div className="auth-group" style={authGroup}>
        <Link href="/login" style={ghostLink}>
          Iniciar sesión
        </Link>
        <Link href="/register" style={primaryLink}>
          Registrarse
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-group" style={authGroup}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        style={profileLink}
        aria-expanded={open}
        aria-label="Abrir menu de perfil"
      >
        <UserAvatar
          name={user.displayName}
          email={user.email}
          photoURL={user.photoURL}
          size={42}
          label="Abrir perfil"
        />
        <div className="auth-user-text" style={userText}>
          <strong>{user.displayName || "Usuario"}</strong>
          <span>{user.email}</span>
        </div>
      </button>

      <button type="button" onClick={logout} style={logoutButton}>
        Salir
      </button>

      {open && (
        <div style={menuStyle}>
          <Link href="/perfil" style={menuLink}>Mi perfil</Link>
          <Link href="/mensajes" style={menuLink}>Mensajes</Link>
          <Link href="/favoritos" style={menuLink}>Favoritos</Link>
          <Link href="/ayuda" style={menuLink}>Ayuda y feedback</Link>
          <Link href="/publicar" style={menuPrimary}>Publicar producto</Link>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 760px) {
          .auth-user-text {
            display: none !important;
          }

          .auth-group {
            flex: 1 !important;
            gap: 8px !important;
            justify-content: flex-end !important;
            min-width: 0 !important;
          }

          .auth-group a {
            flex: 1 1 0 !important;
            justify-content: center !important;
            min-width: 0 !important;
            white-space: nowrap !important;
          }

          .auth-group button {
            justify-content: center !important;
          }
        }

        .auth-user-text strong,
        .auth-user-text span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 520px) {
          .auth-group a,
          .auth-group button {
            min-height: 40px !important;
            padding-left: 10px !important;
            padding-right: 10px !important;
          }

          .auth-group a {
            font-size: 13px !important;
          }
        }

        @media (max-width: 380px) {
          .auth-group a {
            font-size: 12px !important;
            padding-left: 8px !important;
            padding-right: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}

const authGroup: React.CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
  flexShrink: 0,
};

const ghostLink: React.CSSProperties = {
  minHeight: "44px",
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  padding: "0 14px",
  textDecoration: "none",
  fontWeight: "900",
};

const primaryLink: React.CSSProperties = {
  ...ghostLink,
  border: "none",
  background: "linear-gradient(135deg, #ffb067, #ff7b00)",
  color: "#101010",
};

const profileLink: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  color: "white",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  borderRadius: "8px",
  padding: "4px 8px 4px 4px",
  cursor: "pointer",
  minWidth: 0,
  flexShrink: 1,
  maxWidth: "214px",
};

const userText: React.CSSProperties = {
  display: "grid",
  maxWidth: "144px",
  minWidth: 0,
};

const logoutButton: React.CSSProperties = {
  minHeight: "42px",
  border: "1px solid rgba(255,255,255,0.1)",
  cursor: "pointer",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  padding: "0 12px",
  borderRadius: "8px",
  fontWeight: "900",
  flexShrink: 0,
};

const menuStyle: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 10px)",
  right: 0,
  width: "220px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(12,12,12,0.96)",
  backdropFilter: "blur(18px)",
  borderRadius: "8px",
  padding: "8px",
  display: "grid",
  gap: "6px",
  boxShadow: "0 24px 70px rgba(0,0,0,0.38)",
  zIndex: 1000,
};

const menuLink: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  borderRadius: "8px",
  padding: "11px 12px",
  fontWeight: "900",
  background: "rgba(255,255,255,0.04)",
};

const menuPrimary: React.CSSProperties = {
  ...menuLink,
  background: "linear-gradient(135deg, #ffb067, #ff7b00)",
  color: "#101010",
};
