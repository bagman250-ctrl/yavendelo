"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, signOut } from "firebase/auth";

import { auth } from "../app/firebase/config";

export default function AuthButtons() {
  const [user, setUser] = useState<User | null>(null);

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
      <div style={authGroup}>
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
    <div style={authGroup}>
      <Link href="/perfil" style={profileLink}>
        <div style={avatar}>{user.email?.charAt(0).toUpperCase() || "U"}</div>
        <div style={userText}>
          <strong>{user.displayName || "Usuario"}</strong>
          <span>{user.email}</span>
        </div>
      </Link>

      <button type="button" onClick={logout} style={logoutButton}>
        Salir
      </button>
    </div>
  );
}

const authGroup: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const ghostLink: React.CSSProperties = {
  minHeight: "44px",
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  padding: "0 16px",
  textDecoration: "none",
  fontWeight: "900",
};

const primaryLink: React.CSSProperties = {
  ...ghostLink,
  border: "none",
  background: "#ff7b00",
  color: "#101010",
};

const profileLink: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  color: "white",
  textDecoration: "none",
};

const avatar: React.CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "8px",
  background: "#ff7b00",
  color: "#101010",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "900",
};

const userText: React.CSSProperties = {
  display: "grid",
  maxWidth: "180px",
};

const logoutButton: React.CSSProperties = {
  minHeight: "42px",
  border: "1px solid rgba(255,255,255,0.1)",
  cursor: "pointer",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  padding: "0 14px",
  borderRadius: "8px",
  fontWeight: "900",
};
