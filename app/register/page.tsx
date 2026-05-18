"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "../firebase/config";
import TopBar from "../../components/TopBar";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function register() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Completa todos los campos");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener mínimo 6 caracteres");
      return;
    }

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);

      await updateProfile(userCredential.user, { displayName: name.trim() });
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: name.trim(),
        email: email.trim(),
        photoURL: "",
        verified: false,
        role: "user",
        createdAt: serverTimestamp(),
      });

      toast.success("Cuenta creada correctamente");
      window.location.href = "/";
    } catch (error) {
      console.error("Error registrando usuario:", error);
      const code = error instanceof FirebaseError ? error.code : "";

      if (code === "auth/email-already-in-use") {
        toast.error("Ese correo ya está registrado");
        return;
      }

      if (code === "auth/invalid-email") {
        toast.error("El correo no es válido");
        return;
      }

      if (code === "auth/weak-password") {
        toast.error("La contraseña es muy débil");
        return;
      }

      toast.error("Error al crear cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TopBar />

      <main className="fade-in" style={pageStyle}>
        <section style={cardStyle}>
          <div style={badgeStyle}>Nueva cuenta</div>
          <h1 style={titleStyle}>Únete a YaVendelo.</h1>
          <p style={copyStyle}>Crea tu perfil para publicar productos, recibir mensajes y guardar favoritos.</p>

          <label style={fieldStyle}>
            <span style={labelStyle}>Nombre</span>
            <input
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={(event) => setName(event.target.value)}
              style={inputStyle}
            />
          </label>

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
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") register();
              }}
              style={inputStyle}
            />
          </label>

          <button
            type="button"
            onClick={register}
            disabled={loading}
            style={{ ...buttonStyle, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          <p style={footerText}>
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" style={footerLink}>
              Iniciar sesión
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
