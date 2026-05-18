"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { auth, db } from "@/app/firebase/config";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";

const reasons = [
  "Ayuda con mi cuenta",
  "Problema con una publicacion",
  "Pago o boost premium",
  "Reporte de seguridad",
  "Sugerencia",
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(auth.currentUser?.email || "");
  const [reason, setReason] = useState(reasons[0]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function sendMessage() {
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMessage = message.trim();

    if (!cleanName || !cleanEmail || !cleanMessage) {
      toast.error("Completa nombre, correo y mensaje");
      return;
    }

    if (!cleanEmail.includes("@")) {
      toast.error("Ingresa un correo valido");
      return;
    }

    if (cleanMessage.length < 15) {
      toast.error("Cuéntanos un poco mas del caso");
      return;
    }

    try {
      setSending(true);

      await addDoc(collection(db, "supportMessages"), {
        name: cleanName,
        email: cleanEmail,
        reason,
        message: cleanMessage,
        status: "open",
        userId: auth.currentUser?.uid || null,
        createdAt: serverTimestamp(),
      });

      setName("");
      setMessage("");
      toast.success("Mensaje enviado");
    } catch (error) {
      console.error("Error enviando contacto:", error);
      toast.error("No se pudo enviar el mensaje");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <TopBar />

      <main style={pageStyle}>
        <section style={containerStyle}>
          <div style={headerCard}>
            <span style={badge}>Contacto</span>
            <h1 style={titleStyle}>Estamos para ayudarte.</h1>
            <p style={textStyle}>
              Envia tu caso y lo dejaremos registrado para seguimiento. Para productos especificos,
              tambien puedes usar el boton de reporte dentro de cada publicacion.
            </p>
          </div>

          <section style={contentGrid}>
            <form
              style={formCard}
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
            >
              <label style={fieldStyle}>
                <span style={labelStyle}>Nombre</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Tu nombre"
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                <span style={labelStyle}>Correo</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="correo@email.com"
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                <span style={labelStyle}>Motivo</span>
                <select value={reason} onChange={(event) => setReason(event.target.value)} style={inputStyle}>
                  {reasons.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label style={fieldStyle}>
                <span style={labelStyle}>Mensaje</span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Describe que paso y como podemos ayudarte"
                  style={textareaStyle}
                />
              </label>

              <button type="submit" disabled={sending} style={{ ...buttonStyle, opacity: sending ? 0.7 : 1 }}>
                {sending ? "Enviando..." : "Enviar mensaje"}
              </button>
            </form>

            <aside style={sideCard}>
              <article style={infoBox}>
                <h2 style={subtitleStyle}>Correo directo</h2>
                <p style={textStyle}>bagman250@gmail.com</p>
              </article>

              <article style={infoBox}>
                <h2 style={subtitleStyle}>Flujos importantes</h2>
                <p style={textStyle}>
                  Para ventas usa el chat del producto. Para contenido sospechoso usa reportar publicacion.
                </p>
              </article>

              <div style={actions}>
                <Link href="/" style={{ textDecoration: "none" }}>
                  <button type="button" style={secondaryButton}>
                    Volver al inicio
                  </button>
                </Link>
                <Link href="/publicar" style={{ textDecoration: "none" }}>
                  <button type="button" style={secondaryButton}>
                    Publicar producto
                  </button>
                </Link>
              </div>
            </aside>
          </section>
        </section>
      </main>

      <BottomNav />
    </>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, rgba(255,123,0,0.08), transparent 380px), #070707",
  color: "white",
  padding: "42px 24px 140px",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "1120px",
  margin: "0 auto",
};

const headerCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  borderRadius: "8px",
  padding: "28px",
  marginBottom: "18px",
};

const badge: React.CSSProperties = {
  display: "inline-flex",
  background: "rgba(255,123,0,0.12)",
  border: "1px solid rgba(255,123,0,0.22)",
  color: "#ffb067",
  padding: "9px 12px",
  borderRadius: "8px",
  fontWeight: "900",
  marginBottom: "18px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "46px",
  lineHeight: 1.05,
  fontWeight: "900",
};

const subtitleStyle: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: "22px",
  fontWeight: "900",
};

const textStyle: React.CSSProperties = {
  color: "#cfcfcf",
  lineHeight: 1.8,
  fontSize: "16px",
};

const contentGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(320px,100%),1fr))",
  gap: "18px",
};

const formCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  borderRadius: "8px",
  padding: "24px",
};

const sideCard: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

const fieldStyle: React.CSSProperties = {
  display: "grid",
  gap: "8px",
  marginBottom: "14px",
};

const labelStyle: React.CSSProperties = {
  color: "#d8d8d8",
  fontWeight: "900",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.24)",
  color: "white",
  borderRadius: "8px",
  padding: "14px",
  outline: "none",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "160px",
  resize: "vertical",
  lineHeight: 1.6,
};

const infoBox: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  padding: "20px",
};

const actions: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const buttonStyle: React.CSSProperties = {
  border: "none",
  background: "#ff7b00",
  color: "#101010",
  padding: "15px 18px",
  borderRadius: "8px",
  fontWeight: "900",
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  ...buttonStyle,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
};
