"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { auth, db } from "@/app/firebase/config";

type ProductForReport = {
  id: string;
  titulo?: string;
  userEmail?: string;
};

type ReportButtonProps = {
  product: ProductForReport;
};

export default function ReportButton({ product }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function openReport() {
    if (!auth.currentUser) {
      toast.error("Debes iniciar sesion para reportar");
      return;
    }

    setOpen(true);
  }

  async function submitReport() {
    const trimmedReason = reason.trim();

    if (!auth.currentUser) {
      toast.error("Debes iniciar sesion");
      return;
    }

    if (trimmedReason.length < 10) {
      toast.error("Agrega un motivo mas claro");
      return;
    }

    try {
      setSubmitting(true);

      await addDoc(collection(db, "reports"), {
        productId: product.id,
        productTitle: product.titulo || "Producto",
        sellerEmail: product.userEmail || null,
        reason: trimmedReason,
        status: "pending",
        reportedBy: auth.currentUser.email,
        reportedByUid: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });

      setReason("");
      setOpen(false);
      toast.success("Reporte enviado");
    } catch (error) {
      console.error("Error enviando reporte:", error);
      toast.error("No se pudo enviar el reporte");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button type="button" onClick={openReport} style={reportButton}>
        Reportar publicacion
      </button>

      {open && (
        <div style={overlay} role="presentation">
          <section style={dialog} role="dialog" aria-modal="true" aria-labelledby="report-title">
            <h2 id="report-title" style={dialogTitle}>
              Reportar publicacion
            </h2>

            <p style={dialogText}>
              Revisaremos el reporte y tomaremos accion si la publicacion rompe las reglas.
            </p>

            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Describe el problema"
              rows={5}
              style={textarea}
            />

            <div style={actions}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                style={secondaryButton}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={submitReport}
                disabled={submitting}
                style={{ ...primaryButton, opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? "Enviando..." : "Enviar reporte"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

const reportButton: React.CSSProperties = {
  border: "1px solid rgba(255,80,80,0.32)",
  background: "rgba(255,80,80,0.12)",
  color: "#ff9a9a",
  padding: "12px 14px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "900",
  fontSize: "14px",
};

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 10000,
  background: "rgba(0,0,0,0.72)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "18px",
};

const dialog: React.CSSProperties = {
  width: "100%",
  maxWidth: "520px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "#101010",
  borderRadius: "8px",
  padding: "24px",
  boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
};

const dialogTitle: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: "28px",
  fontWeight: "900",
};

const dialogText: React.CSSProperties = {
  color: "#bdbdbd",
  lineHeight: 1.6,
  marginBottom: "16px",
};

const textarea: React.CSSProperties = {
  width: "100%",
  resize: "vertical",
  minHeight: "130px",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  padding: "14px",
  outline: "none",
  lineHeight: 1.5,
};

const actions: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  marginTop: "16px",
};

const primaryButton: React.CSSProperties = {
  border: "none",
  background: "#ff7b00",
  color: "#101010",
  padding: "13px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "900",
};

const secondaryButton: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  padding: "13px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "900",
};
