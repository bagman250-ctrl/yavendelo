"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { auth, db } from "@/app/firebase/config";
import { analyticsEvents, trackEvent } from "@/lib/analytics";

const priorities = ["Baja", "Media", "Alta", "Bloqueante"];

type BetaFeedbackFormProps = {
  defaultPage?: string;
  compact?: boolean;
};

export default function BetaFeedbackForm({ defaultPage = "", compact = false }: BetaFeedbackFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [page, setPage] = useState(defaultPage);
  const [priority, setPriority] = useState("Media");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setName(auth.currentUser?.displayName || "");
    setEmail(auth.currentUser?.email || "");
    if (!defaultPage && typeof window !== "undefined") {
      setPage(window.location.pathname);
    }
  }, [defaultPage]);

  async function submitFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanMessage = message.trim();
    if (cleanMessage.length < 10) {
      toast.error("Describe el problema con un poco mas de detalle");
      return;
    }

    try {
      setSending(true);

      await addDoc(collection(db, "betaFeedback"), {
        name: name.trim() || auth.currentUser?.displayName || "Usuario YaVendelo",
        email: email.trim() || auth.currentUser?.email || "sin-correo@yavendeloapp.com",
        description: cleanMessage,
        message: cleanMessage,
        page: page.trim() || "No especificada",
        priority,
        status: "pending",
        userId: auth.currentUser?.uid || null,
        source: "public_feedback",
        createdAt: serverTimestamp(),
      });

      trackEvent(analyticsEvents.betaFeedbackSubmit, {
        page: page.trim() || "unknown",
        priority,
      });
      setMessage("");
      toast.success("Gracias por reportarlo. Lo revisaremos pronto.");
    } catch (error) {
      console.error("Error enviando feedback:", error);
      toast.error("No se pudo enviar el reporte");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submitFeedback} style={compact ? compactCard : cardStyle}>
      <div>
        <span style={badgeStyle}>Reportar problema</span>
        <h2 style={titleStyle}>Tu feedback nos ayuda a mejorar.</h2>
        <p style={textStyle}>Cuéntanos qué pasó, en qué página ocurrió y qué tan urgente es.</p>
      </div>

      <div style={gridStyle}>
        <label style={fieldStyle}>
          <span>Nombre opcional</span>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tu nombre" style={inputStyle} />
        </label>

        <label style={fieldStyle}>
          <span>Email opcional</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="correo@email.com" style={inputStyle} />
        </label>
      </div>

      <div style={gridStyle}>
        <label style={fieldStyle}>
          <span>Página donde ocurrió</span>
          <input value={page} onChange={(event) => setPage(event.target.value)} placeholder="/producto/..." style={inputStyle} />
        </label>

        <label style={fieldStyle}>
          <span>Prioridad</span>
          <select value={priority} onChange={(event) => setPriority(event.target.value)} style={inputStyle}>
            {priorities.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <label style={fieldStyle}>
        <span>Descripción</span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Describe el error, qué intentabas hacer y qué esperabas que pasara."
          style={textareaStyle}
        />
      </label>

      <button type="submit" disabled={sending} style={{ ...buttonStyle, opacity: sending ? 0.7 : 1 }}>
        {sending ? "Enviando..." : "Enviar reporte"}
      </button>
    </form>
  );
}

const cardStyle: React.CSSProperties = {
  display: "grid",
  gap: "16px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.035))",
  borderRadius: "8px",
  padding: "24px",
  boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
};

const compactCard: React.CSSProperties = {
  ...cardStyle,
  padding: "18px",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  borderRadius: "8px",
  border: "1px solid rgba(255,123,0,0.22)",
  background: "rgba(255,123,0,0.12)",
  color: "#ffb067",
  padding: "8px 10px",
  fontSize: "12px",
  fontWeight: "900",
  marginBottom: "12px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "white",
  fontSize: "28px",
  fontWeight: "900",
};

const textStyle: React.CSSProperties = {
  color: "#bdbdbd",
  lineHeight: 1.65,
  margin: "8px 0 0",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: "12px",
};

const fieldStyle: React.CSSProperties = {
  display: "grid",
  gap: "8px",
  color: "#d8d8d8",
  fontSize: "13px",
  fontWeight: "900",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(16,16,16,0.92)",
  color: "white",
  borderRadius: "8px",
  padding: "14px",
  outline: "none",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "150px",
  resize: "vertical",
  lineHeight: 1.6,
};

const buttonStyle: React.CSSProperties = {
  border: "none",
  background: "linear-gradient(135deg, #ffb067, #ff7b00)",
  color: "#101010",
  padding: "15px 18px",
  borderRadius: "8px",
  fontWeight: "900",
  cursor: "pointer",
};
