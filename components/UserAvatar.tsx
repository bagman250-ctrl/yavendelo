type UserAvatarProps = {
  name?: string | null;
  email?: string | null;
  photoURL?: string | null;
  size?: number;
  label?: string;
};

export default function UserAvatar({
  name,
  email,
  photoURL,
  size = 44,
  label = "Avatar de usuario",
}: UserAvatarProps) {
  const initial = (name || email || "U").trim().charAt(0).toUpperCase() || "U";

  return (
    <div
      style={{
        ...avatarStyle,
        width: size,
        height: size,
        fontSize: Math.max(13, Math.round(size * 0.38)),
      }}
      aria-label={label}
    >
      {photoURL ? (
        <img src={photoURL} alt="" style={imageStyle} loading="lazy" decoding="async" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

const avatarStyle: React.CSSProperties = {
  overflow: "hidden",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "linear-gradient(135deg, #ffb067, #ff7b00)",
  color: "#101010",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "900",
  flexShrink: 0,
  boxShadow: "0 14px 34px rgba(255,123,0,0.22)",
};

const imageStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};
