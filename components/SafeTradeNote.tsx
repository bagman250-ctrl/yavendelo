type SafeTradeNoteProps = {
  compact?: boolean;
  title?: string;
};

export default function SafeTradeNote({
  compact = false,
  title = "Compra segura",
}: SafeTradeNoteProps) {
  return (
    <aside style={compact ? compactStyle : noteStyle} aria-label="Consejos de seguridad">
      <span style={badgeStyle}>Beta segura</span>
      <strong style={titleStyle}>{title}</strong>
      <p style={textStyle}>
        No compartas codigos, contrasenas ni anticipos fuera del chat. Revisa el producto y acuerda
        entregas en lugares seguros.
      </p>
    </aside>
  );
}

const noteStyle: React.CSSProperties = {
  border: "1px solid rgba(255,123,0,0.24)",
  background: "linear-gradient(180deg, rgba(255,123,0,0.13), rgba(255,255,255,0.035))",
  borderRadius: "8px",
  padding: "18px",
  boxShadow: "0 18px 45px rgba(0,0,0,0.2)",
};

const compactStyle: React.CSSProperties = {
  ...noteStyle,
  padding: "14px",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  borderRadius: "8px",
  border: "1px solid rgba(255,123,0,0.24)",
  background: "rgba(0,0,0,0.22)",
  color: "#ffb067",
  padding: "7px 9px",
  fontSize: "12px",
  fontWeight: "900",
  marginBottom: "10px",
};

const titleStyle: React.CSSProperties = {
  display: "block",
  color: "white",
  fontSize: "18px",
  fontWeight: "900",
  marginBottom: "6px",
};

const textStyle: React.CSSProperties = {
  margin: 0,
  color: "#ffd2a3",
  lineHeight: 1.6,
  fontSize: "14px",
  fontWeight: "800",
};
