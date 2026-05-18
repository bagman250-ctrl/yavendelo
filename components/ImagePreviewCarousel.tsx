"use client";

interface ImagePreviewCarouselProps {
  previews: string[];
  onRemove: (index: number) => void;
}

export default function ImagePreviewCarousel({
  previews,
  onRemove,
}: ImagePreviewCarouselProps) {
  if (previews.length === 0) return null;

  return (
    <div style={wrapStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>📸 Imágenes seleccionadas</h3>
        <span style={countStyle}>{previews.length} fotos</span>
      </div>

      <div style={gridStyle}>
        {previews.map((preview, index) => (
          <div key={preview} style={itemStyle}>
            <img src={preview} alt={`preview-${index}`} style={imageStyle} />

            {index === 0 && <div style={mainBadge}>Principal</div>}

            <button
              type="button"
              onClick={() => onRemove(index)}
              style={removeButton}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const wrapStyle: React.CSSProperties = {
  marginBottom: "28px",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  marginBottom: "14px",
};

const titleStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: "900",
};

const countStyle: React.CSSProperties = {
  color: "#ffb067",
  fontWeight: "900",
  fontSize: "14px",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
  gap: "14px",
};

const itemStyle: React.CSSProperties = {
  position: "relative",
  borderRadius: "22px",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.05)",
};

const imageStyle: React.CSSProperties = {
  width: "100%",
  height: "160px",
  objectFit: "cover",
  display: "block",
};

const mainBadge: React.CSSProperties = {
  position: "absolute",
  left: "10px",
  bottom: "10px",
  padding: "7px 10px",
  borderRadius: "999px",
  background: "linear-gradient(135deg,#ff7b00,#ff5500)",
  color: "white",
  fontSize: "12px",
  fontWeight: "900",
};

const removeButton: React.CSSProperties = {
  position: "absolute",
  top: "10px",
  right: "10px",
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  border: "none",
  background: "rgba(0,0,0,0.65)",
  color: "white",
  cursor: "pointer",
  fontWeight: "900",
};