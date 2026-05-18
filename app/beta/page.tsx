"use client";

import { useEffect } from "react";
import Link from "next/link";

import BetaFeedbackForm from "@/components/BetaFeedbackForm";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import { analyticsEvents, trackEvent } from "@/lib/analytics";

const checklist = [
  "Crear cuenta con email y contraseña",
  "Iniciar sesión con Google",
  "Completar nombre y subir foto en perfil",
  "Publicar un producto con imágenes reales",
  "Guardar un producto en favoritos",
  "Iniciar un chat desde una publicación",
  "Revisar mensajes y notificaciones",
  "Abrir el perfil público de un vendedor",
  "Reportar cualquier error visual o funcional",
];

export default function BetaPage() {
  useEffect(() => {
    trackEvent(analyticsEvents.betaPageView, { page: "/beta" });
  }, []);

  return (
    <>
      <TopBar />

      <main style={pageStyle}>
        <section style={containerStyle}>
          <section style={heroCard}>
            <span style={badgeStyle}>Beta cerrada</span>
            <h1 style={titleStyle}>Gracias por probar YaVendelo.</h1>
            <p style={textStyle}>
              Estás usando una versión beta. Algunas funciones pueden cambiar. Tu feedback nos ayuda a preparar
              una beta pública más estable, rápida y confiable.
            </p>
            <div style={actionsStyle}>
              <Link href="/" style={{ textDecoration: "none" }}>
                <button type="button" style={primaryButton}>Probar marketplace</button>
              </Link>
              <a href="#feedback" style={secondaryLink}>Reportar problema</a>
            </div>
          </section>

          <section className="beta-grid" style={gridStyle}>
            <article style={panelStyle}>
              <span style={badgeStyle}>Checklist tester</span>
              <h2 style={sectionTitle}>Qué probar esta semana</h2>
              <div style={checklistStyle}>
                {checklist.map((item, index) => (
                  <div key={item} style={checkItem}>
                    <strong>{index + 1}</strong>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>

            <aside style={panelStyle}>
              <span style={badgeStyle}>Notas</span>
              <h2 style={sectionTitle}>Cómo reportar mejor</h2>
              <p style={textStyle}>
                Incluye la página donde ocurrió, pasos para repetirlo, dispositivo usado y si bloqueó tu flujo.
                Si algo se siente lento, confuso o poco confiable, también cuenta como feedback.
              </p>
              <Link href="/contacto" style={inlineLink}>Contacto general</Link>
            </aside>
          </section>

          <section id="feedback" style={feedbackWrap}>
            <BetaFeedbackForm defaultPage="/beta" />
          </section>
        </section>

        <style jsx>{`
          @media (max-width: 760px) {
            .beta-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
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

const heroCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.1)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.035))",
  borderRadius: "8px",
  padding: "32px",
  marginBottom: "18px",
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
  marginBottom: "14px",
};

const titleStyle: React.CSSProperties = {
  maxWidth: "780px",
  margin: 0,
  fontSize: "52px",
  lineHeight: 1.04,
  fontWeight: "900",
};

const sectionTitle: React.CSSProperties = {
  margin: "0 0 14px",
  fontSize: "28px",
  fontWeight: "900",
};

const textStyle: React.CSSProperties = {
  maxWidth: "760px",
  color: "#cfcfcf",
  lineHeight: 1.75,
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  marginTop: "22px",
};

const primaryButton: React.CSSProperties = {
  border: "none",
  background: "linear-gradient(135deg, #ffb067, #ff7b00)",
  color: "#101010",
  padding: "14px 18px",
  borderRadius: "8px",
  fontWeight: "900",
  cursor: "pointer",
};

const secondaryLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  padding: "14px 18px",
  borderRadius: "8px",
  fontWeight: "900",
  textDecoration: "none",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1.2fr) minmax(280px,0.8fr)",
  gap: "18px",
  marginBottom: "18px",
};

const panelStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.1)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.028))",
  borderRadius: "8px",
  padding: "24px",
};

const checklistStyle: React.CSSProperties = {
  display: "grid",
  gap: "10px",
};

const checkItem: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  alignItems: "center",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.045)",
  borderRadius: "8px",
  padding: "12px",
};

const inlineLink: React.CSSProperties = {
  color: "#ffb067",
  fontWeight: "900",
  textDecoration: "none",
};

const feedbackWrap: React.CSSProperties = {
  scrollMarginTop: "90px",
};
