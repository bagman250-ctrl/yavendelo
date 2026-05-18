"use client";

import { useEffect } from "react";
import Link from "next/link";

import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error de aplicacion:", error);
  }, [error]);

  return (
    <>
      <TopBar />

      <main style={pageStyle}>
        <section style={cardStyle}>
          <span style={eyebrow}>Error</span>
          <h1 style={titleStyle}>Algo no cargo correctamente</h1>
          <p style={textStyle}>
            Puedes reintentar la carga o volver al catalogo principal.
          </p>

          <div style={actionsStyle}>
            <button type="button" onClick={reset} style={buttonStyle}>
              Reintentar
            </button>
            <Link href="/" style={{ textDecoration: "none" }}>
              <button type="button" style={secondaryButton}>
                Ir al inicio
              </button>
            </Link>
          </div>
        </section>
      </main>

      <BottomNav />
    </>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "linear-gradient(180deg, rgba(255,123,0,0.08), transparent 360px), #070707",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "42px 24px 140px",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "560px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  borderRadius: "8px",
  padding: "32px",
  textAlign: "center",
};

const eyebrow: React.CSSProperties = {
  display: "inline-flex",
  borderRadius: "8px",
  border: "1px solid rgba(255,123,0,0.22)",
  background: "rgba(255,123,0,0.12)",
  color: "#ffb067",
  padding: "8px 10px",
  fontSize: "12px",
  fontWeight: "900",
};

const titleStyle: React.CSSProperties = {
  margin: "12px 0",
  fontSize: "42px",
  lineHeight: 1.08,
  fontWeight: "900",
};

const textStyle: React.CSSProperties = {
  color: "#bdbdbd",
  lineHeight: 1.7,
  marginBottom: "22px",
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  justifyContent: "center",
  flexWrap: "wrap",
};

const buttonStyle: React.CSSProperties = {
  border: "none",
  background: "#ff7b00",
  color: "#101010",
  padding: "14px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "900",
};

const secondaryButton: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  padding: "14px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "900",
};
