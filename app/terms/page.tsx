import Link from "next/link";

import BottomNav from "../../components/BottomNav";
import TopBar from "../../components/TopBar";

const sections = [
  {
    title: "Publicaciones",
    text: "No se permite publicar productos ilegales, engañosos, falsificados, peligrosos o que incumplan leyes aplicables.",
  },
  {
    title: "Compras y ventas",
    text: "Los acuerdos entre usuarios son responsabilidad de comprador y vendedor. Recomendamos revisar productos, comunicarse por el chat y tomar precauciones antes de concretar una operación.",
  },
  {
    title: "Boosts premium",
    text: "Los boosts destacan publicaciones por tiempo limitado. Una vez aprobado el pago, la publicación puede recibir mayor visibilidad dentro de la plataforma.",
  },
  {
    title: "Moderación",
    text: "YaVendelo puede ocultar, eliminar o revisar publicaciones, reportes o cuentas que incumplan estas reglas.",
  },
];

export default function TermsPage() {
  return (
    <>
      <TopBar />
      <main style={pageStyle}>
        <section style={cardStyle}>
          <span style={badge}>Términos</span>
          <h1 style={titleStyle}>Términos y Condiciones</h1>
          <p style={textStyle}>
            Al usar YaVendelo aceptas utilizar la plataforma de forma responsable, honesta y segura. YaVendelo conecta compradores y vendedores, pero cada usuario es responsable de la información, productos y acuerdos que publique o realice.
          </p>

          {sections.map((section) => (
            <article key={section.title} style={sectionStyle}>
              <h2 style={subtitleStyle}>{section.title}</h2>
              <p style={textStyle}>{section.text}</p>
            </article>
          ))}

          <Link href="/" style={{ textDecoration: "none" }}>
            <button type="button" style={buttonStyle}>Volver al inicio</button>
          </Link>
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

const cardStyle: React.CSSProperties = {
  maxWidth: "900px",
  margin: "0 auto",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  padding: "34px",
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
  margin: "0 0 18px",
  fontSize: "46px",
  lineHeight: 1.05,
  fontWeight: "900",
};

const subtitleStyle: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: "24px",
  fontWeight: "900",
};

const textStyle: React.CSSProperties = {
  color: "#cfcfcf",
  lineHeight: 1.8,
  fontSize: "16px",
};

const sectionStyle: React.CSSProperties = {
  marginTop: "24px",
};

const buttonStyle: React.CSSProperties = {
  marginTop: "28px",
  border: "none",
  background: "#ff7b00",
  color: "#101010",
  padding: "15px 18px",
  borderRadius: "8px",
  fontWeight: "900",
  cursor: "pointer",
};
