import Link from "next/link";

import InstallPrompt from "./InstallPrompt";

export default function BetaBanner() {
  if (process.env.NEXT_PUBLIC_BETA_MODE !== "true") return null;

  return (
    <div style={bannerStyle}>
      <div style={innerStyle}>
        <span style={pillStyle}>Marketplace local</span>
        <span style={copyStyle}>Compra y vende cerca de ti con publicaciones gratis y chat directo.</span>
        <Link href="/ayuda" style={linkStyle}>Ayuda</Link>
        <Link href="/ayuda#feedback" style={linkStyle}>Reportar problema</Link>
        <InstallPrompt />
      </div>
    </div>
  );
}

const bannerStyle: React.CSSProperties = {
  background: "rgba(255,123,0,0.1)",
  borderBottom: "1px solid rgba(255,123,0,0.18)",
  color: "white",
};

const innerStyle: React.CSSProperties = {
  width: "min(1240px, 100%)",
  margin: "0 auto",
  padding: "9px 24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  flexWrap: "wrap",
  fontSize: "13px",
};

const pillStyle: React.CSSProperties = {
  border: "1px solid rgba(255,123,0,0.28)",
  background: "rgba(255,123,0,0.14)",
  color: "#ffb067",
  borderRadius: "8px",
  padding: "5px 8px",
  fontWeight: "900",
};

const copyStyle: React.CSSProperties = {
  color: "#d8d8d8",
  fontWeight: "800",
};

const linkStyle: React.CSSProperties = {
  color: "#ffb067",
  textDecoration: "none",
  fontWeight: "900",
};
