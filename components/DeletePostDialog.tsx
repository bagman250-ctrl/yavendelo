"use client";

type DeletePostDialogProps = {
  open: boolean;
  title?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeletePostDialog({
  open,
  title,
  loading = false,
  onCancel,
  onConfirm,
}: DeletePostDialogProps) {
  if (!open) return null;

  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-labelledby="delete-post-title">
      <section style={dialog}>
        <span style={badge}>Accion irreversible</span>
        <h2 id="delete-post-title" style={heading}>
          ¿Seguro que deseas eliminar esta publicación?
        </h2>
        <p style={text}>
          {title ? `Vas a eliminar "${title}". ` : ""}
          Esta acción no se puede deshacer.
        </p>
        <div style={actions}>
          <button type="button" onClick={onCancel} disabled={loading} style={cancelButton}>
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} style={{ ...deleteButton, opacity: loading ? 0.72 : 1 }}>
            {loading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </section>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "grid",
  placeItems: "center",
  padding: "20px",
  background: "rgba(0,0,0,0.68)",
  backdropFilter: "blur(14px)",
};

const dialog: React.CSSProperties = {
  width: "min(100%, 460px)",
  borderRadius: "8px",
  border: "1px solid rgba(255,123,0,0.24)",
  background: "linear-gradient(180deg, rgba(24,24,24,0.98), rgba(10,10,10,0.98))",
  boxShadow: "0 28px 80px rgba(0,0,0,0.5), 0 0 40px rgba(255,123,0,0.12)",
  padding: "24px",
  color: "white",
};

const badge: React.CSSProperties = {
  display: "inline-flex",
  borderRadius: "8px",
  border: "1px solid rgba(255,123,0,0.24)",
  background: "rgba(255,123,0,0.12)",
  color: "#ffb067",
  padding: "8px 10px",
  fontSize: "12px",
  fontWeight: "900",
  marginBottom: "14px",
};

const heading: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: "26px",
  lineHeight: 1.08,
  fontWeight: "900",
};

const text: React.CSSProperties = {
  margin: 0,
  color: "#cfcfcf",
  lineHeight: 1.65,
};

const actions: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "22px",
};

const cancelButton: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  borderRadius: "8px",
  padding: "13px 16px",
  fontWeight: "900",
  cursor: "pointer",
};

const deleteButton: React.CSSProperties = {
  border: "1px solid rgba(255,70,70,0.3)",
  background: "linear-gradient(135deg, #ff5b52, #c92525)",
  color: "white",
  borderRadius: "8px",
  padding: "13px 16px",
  fontWeight: "900",
  cursor: "pointer",
};
