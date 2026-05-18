type PremiumLoadingProps = {
  label: string;
};

export default function PremiumLoading({ label }: PremiumLoadingProps) {
  return (
    <main style={pageStyle}>
      <section style={cardStyle} aria-live="polite" aria-busy="true">
        <span style={pulseStyle} />
        <strong>{label}</strong>
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, rgba(255,123,0,0.08), transparent 380px), #070707",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
};

const cardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.035))",
  borderRadius: "8px",
  padding: "18px 20px",
  boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
  fontWeight: "900",
};

const pulseStyle: React.CSSProperties = {
  width: "12px",
  height: "12px",
  borderRadius: "999px",
  background: "#ff7b00",
  boxShadow: "0 0 18px rgba(255,123,0,0.85)",
};
