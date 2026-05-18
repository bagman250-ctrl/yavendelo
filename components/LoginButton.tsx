"use client";

import { useEffect, useState } from "react";
import { User, signInWithPopup, signOut } from "firebase/auth";

import { auth, provider } from "../app/firebase/config";

export default function LoginButton() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  async function login() {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error iniciando sesión:", error);
    }
  }

  async function logout() {
    await signOut(auth);
  }

  if (!user) {
    return (
      <button type="button" onClick={login} style={buttonStyle}>
        Iniciar sesión
      </button>
    );
  }

  return (
    <div style={userRow}>
      {user.photoURL && <img src={user.photoURL} alt={user.displayName || "Usuario"} style={avatarStyle} />}
      <button type="button" onClick={logout} style={buttonStyle}>
        Cerrar sesión
      </button>
    </div>
  );
}

const userRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const buttonStyle: React.CSSProperties = {
  border: "none",
  background: "#ff7b00",
  color: "#101010",
  padding: "12px 16px",
  borderRadius: "8px",
  fontWeight: "900",
  cursor: "pointer",
};

const avatarStyle: React.CSSProperties = {
  width: "40px",
  height: "40px",
  borderRadius: "8px",
  objectFit: "cover",
};
