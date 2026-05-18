import Link from "next/link";

import BottomNav from "../../components/BottomNav";
import TopBar from "../../components/TopBar";

const sections = [
  {
    title: "Datos que podemos recopilar",
    text: "Nombre, correo electrónico, publicaciones, imágenes, mensajes dentro de la plataforma, favoritos, reportes y actividad necesaria para mantener la seguridad del servicio.",
  },
  {
    title: "Pagos",
    text: "Los pagos se procesan mediante Mercado Pago. YaVendelo no almacena datos completos de tarjetas bancarias.",
  },
  {
    title: "Seguridad",
    text: "Utilizamos Firebase y reglas de seguridad para proteger información, accesos, publicaciones, chats y archivos.",
  },
  {
    title: "Contacto",
    text: "Para dudas sobre privacidad puedes contactarnos desde la página de contacto.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <TopBar />
      <main style={pageStyle}>
        <section style={cardStyle}>
          <span style={badge}>Privacidad</span>
          <h1 style={titleStyle}>Política de Privacidad</h1>
          <p style={textStyle}>
            En YaVendelo respetamos tu privacidad. Usamos tus datos únicamente para permitir el funcionamiento del marketplace: crear cuenta, publicar productos, guardar favoritos, enviar mensajes y procesar pagos premium.
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
