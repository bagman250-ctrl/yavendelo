"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db, googleProvider } from "../firebase/config";
import TopBar from "../../components/TopBar";
import { analyticsEvents, trackEvent } from "@/lib/analytics";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function login() {
    if (!email.trim() || !password.trim()) {
      toast.error("Completa correo y contraseña para continuar");
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(auth, email.trim(), password);

      toast.success("Sesión iniciada");
      window.location.href = "/";
    } catch (error) {
      console.error("Error iniciando sesión:", error);
      const code = error instanceof FirebaseError ? error.code : "";

      if (code === "auth/invalid-credential") {
        toast.error("Correo o contraseña incorrectos");
        return;
      }

      if (code === "auth/invalid-email") {
        toast.error("Correo no válido");
        return;
      }

      toast.error("No se pudo iniciar sesión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function loginWithGoogle() {
    try {
      setGoogleLoading(true);

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          name: user.displayName || "Usuario",
          email: user.email || "",
          photoURL: user.photoURL || "",
          verified: user.emailVerified || false,
          role: "user",
          provider: "google",
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      toast.success("Sesión iniciada con Google");
      trackEvent(analyticsEvents.loginGoogle, { method: "google" });
      window.location.href = "/";
    } catch (error) {
      console.error("Error con Google:", error);
      const code = error instanceof FirebaseError ? error.code : "";

      if (code === "auth/popup-closed-by-user") {
        toast.error("Cerraste la ventana de Google");
        return;
      }

      if (code === "auth/account-exists-with-different-credential") {
        toast.error("Ese correo ya existe con otro método de acceso");
        return;
      }

      toast.error("No se pudo iniciar con Google");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <>
      <TopBar />

      <main className="fade-in" style={pageStyle}>
        <section style={cardStyle}>
          <div style={badgeStyle}>Marketplace local</div>

          <h1 style={titleStyle}>Inicia sesión.</h1>

          <p style={copyStyle}>
            Entra a tu cuenta para publicar productos, revisar mensajes y
            administrar tus favoritos.
          </p>

          <button
            type="button"
            onClick={loginWithGoogle}
            disabled={googleLoading || loading}
            style={{
              ...googleButtonStyle,
              opacity: googleLoading || loading ? 0.7 : 1,
            }}
          >
            <span style={googleIconStyle}>G</span>
            {googleLoading ? "Conectando con Google..." : "Continuar con Google"}
          </button>

          <div style={dividerStyle}>
            <span style={dividerLineStyle} />
            <span style={dividerTextStyle}>o inicia con correo</span>
            <span style={dividerLineStyle} />
          </div>

          <label style={fieldStyle}>
            <span style={labelStyle}>Correo electrónico</span>
            <input
              type="email"
              placeholder="correo@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={inputStyle}
              aria-label="Correo electronico"
              autoComplete="email"
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
              aria-label="Contraseña"
              autoComplete="current-password"
            />
          </label>

          <button
            type="button"
            onClick={login}
            disabled={loading || googleLoading}
            style={{
              ...buttonStyle,
              opacity: loading || googleLoading ? 0.7 : 1,
            }}
          >
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
  background:
    "linear-gradient(180deg, rgba(255,123,0,0.08), transparent 360px), #070707",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "24px",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "500px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.035))",
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

const googleButtonStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "#ffffff",
  color: "#111",
  padding: "15px",
  borderRadius: "8px",
  fontWeight: "900",
  fontSize: "15px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
};

const googleIconStyle: React.CSSProperties = {
  width: "24px",
  height: "24px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f1f1f1",
  color: "#4285f4",
  fontWeight: "900",
};

const dividerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  margin: "22px 0",
};

const dividerLineStyle: React.CSSProperties = {
  height: "1px",
  flex: 1,
  background: "rgba(255,255,255,0.12)",
};

const dividerTextStyle: React.CSSProperties = {
  color: "#8f8f8f",
  fontSize: "13px",
  fontWeight: "800",
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
  background: "rgba(16,16,16,0.92)",
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
  background: "linear-gradient(135deg, #ffb067, #ff7b00)",
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
