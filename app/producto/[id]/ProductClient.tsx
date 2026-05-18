"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, query, serverTimestamp, updateDoc, where } from "firebase/firestore";

import { auth, db } from "../../firebase/config";
import BottomNav from "../../../components/BottomNav";
import ReportButton from "../../../components/ReportButton";
import StartChatButton from "../../../components/StartChatButton";
import TopBar from "../../../components/TopBar";

type Product = {
  id: string;
  titulo?: string;
  descripcion?: string;
  precio?: number | string;
  ciudad?: string;
  categoria?: string;
  imagen?: string;
  imagenes?: string[];
  featured?: boolean;
  likes?: number;
  status?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  views?: number;
};

function formatPrice(value?: number | string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function ProductClient({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [favoriteId, setFavoriteId] = useState("");
  const [activeImage, setActiveImage] = useState(0);

  const loadProduct = useCallback(async () => {
    if (!productId) return;

    try {
      const snapshot = await getDoc(doc(db, "posts", productId));

      if (!snapshot.exists()) {
        setProduct(null);
        return;
      }

      const data = { id: snapshot.id, ...snapshot.data() } as Product;
      setProduct(data);

      if (auth.currentUser) {
        const favQuery = query(
          collection(db, "favorites"),
          where("productId", "==", productId),
          where("userId", "==", auth.currentUser.uid)
        );
        const favSnapshot = await getDocs(favQuery);

        if (!favSnapshot.empty) {
          setLiked(true);
          setFavoriteId(favSnapshot.docs[0].id);
        }
      }
    } catch (error) {
      console.error("Error cargando producto:", error);
      toast.error("Error cargando producto");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  useEffect(() => {
    if (!product?.id) return;

    const viewKey = `viewed-product-${product.id}`;
    if (sessionStorage.getItem(viewKey)) return;

    sessionStorage.setItem(viewKey, "true");
    setProduct((prev) =>
      prev
        ? {
            ...prev,
            views: Number(prev.views || 0) + 1,
          }
        : prev
    );

    fetch(`/api/posts/${product.id}/view`, {
      method: "POST",
    }).catch((error) => {
      console.warn("No se pudo registrar vista:", error);
    });
  }, [product?.id]);

  const images = useMemo(() => {
    if (!product) return [];

    return Array.from(
      new Set([...(Array.isArray(product.imagenes) ? product.imagenes : []), product.imagen].filter(Boolean))
    ) as string[];
  }, [product]);

  async function toggleFavorite() {
    if (!auth.currentUser) {
      toast.error("Debes iniciar sesión");
      return;
    }

    if (!product) return;

    try {
      if (liked && favoriteId) {
        await deleteDoc(doc(db, "favorites", favoriteId));
        await updateDoc(doc(db, "posts", product.id), {
          likes: increment(-1),
        });
        setProduct((prev) =>
          prev
            ? {
                ...prev,
                likes: Math.max(0, Number(prev.likes || 0) - 1),
              }
            : prev
        );
        setLiked(false);
        setFavoriteId("");
        toast.success("Eliminado de favoritos");
        return;
      }

      const favRef = await addDoc(collection(db, "favorites"), {
        productId: product.id,
        titulo: product.titulo,
        precio: product.precio,
        imagen: product.imagen || product.imagenes?.[0] || "",
        ciudad: product.ciudad,
        categoria: product.categoria,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        createdAt: serverTimestamp(),
      });

      setFavoriteId(favRef.id);
      await updateDoc(doc(db, "posts", product.id), {
        likes: increment(1),
      });
      setProduct((prev) =>
        prev
          ? {
              ...prev,
              likes: Number(prev.likes || 0) + 1,
            }
          : prev
      );
      setLiked(true);

      if (product.userId && product.userId !== auth.currentUser.uid) {
        await addDoc(collection(db, "notifications"), {
          userId: product.userId,
          title: "Guardaron tu producto",
          message: `${auth.currentUser.email} guardó "${product.titulo}" en favoritos.`,
          type: "favorite",
          read: false,
          link: `/producto/${product.id}`,
          createdAt: serverTimestamp(),
        });
      }

      toast.success("Guardado en favoritos");
    } catch (error) {
      console.error("Error guardando favorito:", error);
      toast.error("No se pudo guardar");
    }
  }

  async function shareProduct() {
    if (!product) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: product.titulo || "Producto en YaVendelo",
          text: product.descripcion || "Mira este producto en YaVendelo",
          url: window.location.href,
        });
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo compartir");
    }
  }

  function nextImage() {
    setActiveImage((prev) => (prev + 1 >= images.length ? 0 : prev + 1));
  }

  function prevImage() {
    setActiveImage((prev) => (prev - 1 < 0 ? images.length - 1 : prev - 1));
  }

  if (loading) return <main style={centerPage}>Cargando producto...</main>;
  if (!product) return <main style={centerPage}>Producto no encontrado</main>;

  const selectedImage = images[activeImage] || "/placeholder.png";
  const isSold = product.status === "sold";

  return (
    <>
      <TopBar />

      <main className="fade-in" style={pageStyle}>
        <div style={containerStyle}>
          <section style={galleryCard}>
            <div style={mainImageWrap}>
              {product.featured && <span style={premiumBadge}>Premium</span>}
              <img src={selectedImage} alt={product.titulo || "Producto"} style={productImage} />

              {images.length > 1 && (
                <>
                  <button type="button" onClick={prevImage} style={leftArrow} aria-label="Imagen anterior">
                    ‹
                  </button>
                  <button type="button" onClick={nextImage} style={rightArrow} aria-label="Siguiente imagen">
                    ›
                  </button>
                  <span style={imageCounter}>
                    {activeImage + 1} / {images.length}
                  </span>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div style={thumbsGrid}>
                {images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    style={{
                      ...thumbButton,
                      border: activeImage === index ? "2px solid #ff7b00" : "1px solid rgba(255,255,255,0.1)",
                    }}
                    aria-label={`Ver imagen ${index + 1}`}
                  >
                    <img src={image} alt={`Imagen ${index + 1}`} style={thumbImage} />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section style={detailsColumn}>
            <div style={badgesRow}>
              <span style={categoryBadge}>{product.categoria || "Producto"}</span>
              {product.featured && <span style={premiumSmallBadge}>Destacado</span>}
              {isSold && <span style={soldBadge}>Vendido</span>}
            </div>

            <h1 style={productTitle}>{product.titulo || "Producto disponible"}</h1>
            <p style={priceStyle}>{formatPrice(product.precio)}</p>
            <p style={cityStyle}>{product.ciudad || "México"}</p>

            <div style={statsRow}>
              <StatPill label="Vistas" value={Number(product.views || 0).toLocaleString("es-MX")} />
              <StatPill label="Guardados" value={Number(product.likes || 0).toLocaleString("es-MX")} />
              <StatPill label="Estado" value={isSold ? "Vendido" : "Disponible"} />
            </div>

            <div style={isSold ? soldNotice : ctaBox}>
              {isSold
                ? "Este producto ya fue marcado como vendido por el vendedor."
                : "Pregunta por disponibilidad, entrega y forma de pago antes de concretar."}
            </div>

            <div style={actionsRow}>
              {!isSold && (
                <StartChatButton
                  productId={product.id}
                  productTitle={product.titulo}
                  sellerId={product.userId}
                  sellerName={product.userName}
                />
              )}

              <button type="button" onClick={toggleFavorite} style={liked ? dangerButton : secondaryButton}>
                {liked ? "Guardado" : "Guardar"}
              </button>

              <button type="button" onClick={shareProduct} style={secondaryButton}>
                Compartir
              </button>

              <ReportButton product={product} />
            </div>

            <article style={cardStyle}>
              <h2 style={sectionTitle}>Descripción</h2>
              <p style={descriptionStyle}>{product.descripcion || "Sin descripción disponible."}</p>
            </article>

            <article style={sellerCard}>
              <span style={sellerLabel}>Vendedor</span>
              <h3 style={sellerName}>{product.userName || "Usuario"}</h3>
              <p style={sellerEmail}>{product.userEmail || "Sin correo visible"}</p>

              {product.userEmail && (
                <Link href={`/vendedor/${encodeURIComponent(product.userEmail)}`} style={{ textDecoration: "none" }}>
                  <button type="button" style={profileButton}>
                    Ver perfil vendedor
                  </button>
                </Link>
              )}
            </article>
          </section>
        </div>

        <BottomNav />
      </main>
    </>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div style={statPill}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, rgba(255,123,0,0.08), transparent 380px), #070707",
  color: "white",
  padding: "42px 24px 140px",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "1240px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
  gap: "32px",
  alignItems: "start",
};

const centerPage: React.CSSProperties = {
  minHeight: "100vh",
  background: "#070707",
  color: "white",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontWeight: "900",
};

const galleryCard: React.CSSProperties = {
  overflow: "hidden",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
};

const mainImageWrap: React.CSSProperties = {
  position: "relative",
  width: "100%",
  aspectRatio: "4 / 3",
  background: "#101010",
  overflow: "hidden",
};

const productImage: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const premiumBadge: React.CSSProperties = {
  position: "absolute",
  top: "16px",
  left: "16px",
  zIndex: 3,
  padding: "9px 12px",
  borderRadius: "8px",
  background: "#ff7b00",
  color: "#101010",
  fontWeight: "900",
};

const leftArrow: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "14px",
  transform: "translateY(-50%)",
  width: "44px",
  height: "44px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.55)",
  color: "white",
  fontSize: "32px",
  cursor: "pointer",
  zIndex: 3,
};

const rightArrow: React.CSSProperties = {
  ...leftArrow,
  left: "auto",
  right: "14px",
};

const imageCounter: React.CSSProperties = {
  position: "absolute",
  right: "16px",
  bottom: "16px",
  zIndex: 3,
  padding: "8px 10px",
  borderRadius: "8px",
  background: "rgba(0,0,0,0.58)",
  border: "1px solid rgba(255,255,255,0.12)",
  fontWeight: "900",
};

const thumbsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(82px,1fr))",
  gap: "10px",
  padding: "12px",
};

const thumbButton: React.CSSProperties = {
  height: "84px",
  borderRadius: "8px",
  overflow: "hidden",
  background: "#101010",
  cursor: "pointer",
  padding: 0,
};

const thumbImage: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const detailsColumn: React.CSSProperties = {
  display: "grid",
  gap: "18px",
};

const badgesRow: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const categoryBadge: React.CSSProperties = {
  display: "inline-flex",
  padding: "9px 12px",
  borderRadius: "8px",
  background: "rgba(255,123,0,0.12)",
  border: "1px solid rgba(255,123,0,0.22)",
  color: "#ffb067",
  fontWeight: "900",
};

const premiumSmallBadge: React.CSSProperties = {
  ...categoryBadge,
  background: "#ff7b00",
  color: "#101010",
};

const soldBadge: React.CSSProperties = {
  ...categoryBadge,
  background: "rgba(255,59,48,0.16)",
  border: "1px solid rgba(255,59,48,0.28)",
  color: "#ff9a9a",
};

const productTitle: React.CSSProperties = {
  margin: 0,
  fontSize: "46px",
  lineHeight: 1.05,
  fontWeight: "900",
};

const priceStyle: React.CSSProperties = {
  margin: 0,
  color: "#ffb067",
  fontSize: "42px",
  fontWeight: "900",
};

const cityStyle: React.CSSProperties = {
  margin: 0,
  color: "#c7c7c7",
  fontWeight: "800",
};

const statsRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))",
  gap: "10px",
};

const statPill: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  borderRadius: "8px",
  padding: "12px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const ctaBox: React.CSSProperties = {
  borderRadius: "8px",
  background: "rgba(255,123,0,0.14)",
  border: "1px solid rgba(255,123,0,0.24)",
  padding: "16px",
  color: "#ffd2a3",
  fontWeight: "900",
  lineHeight: 1.45,
};

const soldNotice: React.CSSProperties = {
  ...ctaBox,
  background: "rgba(255,59,48,0.13)",
  border: "1px solid rgba(255,59,48,0.24)",
  color: "#ffb4b4",
};

const actionsRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  padding: "22px",
};

const sectionTitle: React.CSSProperties = {
  margin: "0 0 14px",
  fontSize: "24px",
  fontWeight: "900",
};

const descriptionStyle: React.CSSProperties = {
  margin: 0,
  color: "#d0d0d0",
  lineHeight: 1.8,
  whiteSpace: "pre-wrap",
};

const sellerCard: React.CSSProperties = {
  ...cardStyle,
};

const sellerLabel: React.CSSProperties = {
  color: "#a7a7a7",
  fontWeight: "900",
};

const sellerName: React.CSSProperties = {
  margin: "10px 0 6px",
  fontSize: "22px",
  fontWeight: "900",
};

const sellerEmail: React.CSSProperties = {
  margin: "0 0 16px",
  color: "#a7a7a7",
  overflowWrap: "anywhere",
};

const profileButton: React.CSSProperties = {
  border: "none",
  cursor: "pointer",
  background: "#ff7b00",
  color: "#101010",
  padding: "14px 18px",
  borderRadius: "8px",
  fontWeight: "900",
};

const secondaryButton: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.12)",
  cursor: "pointer",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  padding: "14px 18px",
  borderRadius: "8px",
  fontWeight: "900",
};

const dangerButton: React.CSSProperties = {
  ...secondaryButton,
  border: "none",
  background: "#ff3b30",
};
