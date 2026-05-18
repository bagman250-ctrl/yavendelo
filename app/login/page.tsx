"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword } from "firebase/auth";

import { auth } from "../firebase/config";
import TopBar from "../../components/TopBar";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    if (!email.trim() || !password.trim()) {
      toast.error("Completa todos los campos");
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      toast.success("Bienvenido a YaVendelo");
      window.location.href = "/";
    } catch (error) {
      console.error("Error iniciando sesión:", error);
      const code = error instanceof FirebaseError ? error.code : "";

      if (code === "auth/invalid-credential" || code === "auth/user-not-found") {
        toast.error("Correo o contraseña incorrectos");
        return;
      }

      if (code === "auth/too-many-requests") {
        toast.error("Demasiados intentos. Intenta más tarde.");
        return;
      }

      toast.error("No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TopBar />

      <main className="fade-in" style={pageStyle}>
        <section style={cardStyle}>
          <div style={badgeStyle}>Acceso seguro</div>
          <h1 style={titleStyle}>Bienvenido de vuelta.</h1>
          <p style={copyStyle}>Inicia sesión para publicar, guardar favoritos y conversar con vendedores.</p>

          <label style={fieldStyle}>
            <span style={labelStyle}>Correo electrónico</span>
            <input
              type="email"
              placeholder="correo@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>Contraseña</span>
            <input
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") login();
              }}
              style={inputStyle}
            />
          </label>

          <button type="button" onClick={login} disabled={loading} style={{ ...buttonStyle, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Entrando..." : "Iniciar sesión"}
          </button>

          <p style={footerText}>
            ¿No tienes cuenta?{" "}
            <Link href="/register" style={footerLink}>
              Crear cuenta
            </Link>
          </p>
        </section>
      </main>
    </>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, rgba(255,123,0,0.08), transparent 360px), #070707",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "24px",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "500px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  padding: "34px",
  boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  borderRadius: "8px",
  background: "rgba(255,123,0,0.12)",
  border: "1px solid rgba(255,123,0,0.22)",
  color: "#ffb067",
  padding: "9px 12px",
  fontWeight: "900",
  marginBottom: "18px",
};

const titleStyle: React.CSSProperties = {
  color: "white",
  margin: 0,
  fontSize: "42px",
  lineHeight: 1.05,
  fontWeight: "900",
};

const copyStyle: React.CSSProperties = {
  color: "#bdbdbd",
  lineHeight: 1.7,
  marginBottom: "24px",
};

const fieldStyle: React.CSSProperties = {
  display: "grid",
  gap: "9px",
  marginBottom: "16px",
};

const labelStyle: React.CSSProperties = {
  color: "#cfcfcf",
  fontWeight: "900",
  fontSize: "14px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  background: "#101010",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "8px",
  padding: "15px",
  color: "white",
  outline: "none",
  fontSize: "15px",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  background: "#ff7b00",
  color: "#101010",
  padding: "16px",
  borderRadius: "8px",
  fontWeight: "900",
  fontSize: "16px",
  marginTop: "8px",
  cursor: "pointer",
};

const footerText: React.CSSProperties = {
  textAlign: "center",
  color: "#a7a7a7",
  margin: "22px 0 0",
};

const footerLink: React.CSSProperties = {
  color: "#ffb067",
  textDecoration: "none",
  fontWeight: "900",
};
