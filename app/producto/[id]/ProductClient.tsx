"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, limit, query, serverTimestamp, updateDoc, where, type Query } from "firebase/firestore";

import { auth, db } from "../../firebase/config";
import BottomNav from "../../../components/BottomNav";
import ReportButton from "../../../components/ReportButton";
import SafeTradeNote from "../../../components/SafeTradeNote";
import StartChatButton from "../../../components/StartChatButton";
import TopBar from "../../../components/TopBar";
import UserAvatar from "../../../components/UserAvatar";
import { analyticsEvents, trackEvent } from "@/lib/analytics";
import { getCategoryHref } from "@/lib/categories";
import { getNotificationActorName } from "@/lib/notificationActors";

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
  userPhotoURL?: string;
  views?: number;
  createdAt?: { seconds?: number } | number | string;
};

function formatPrice(value?: number | string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getDateValue(value?: Product["createdAt"]) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return Number(value?.seconds || 0);
}

function formatPublishedAge(value?: Product["createdAt"]) {
  const raw = getDateValue(value);
  if (!raw) return "Publicado recientemente";

  const millis = raw < 10000000000 ? raw * 1000 : raw;
  const diffDays = Math.max(0, Math.floor((Date.now() - millis) / 86400000));

  if (diffDays === 0) return "Publicado hoy";
  if (diffDays === 1) return "Publicado ayer";
  if (diffDays < 30) return `Publicado hace ${diffDays} días`;

  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(millis));
}

function isRecentlyPublished(value?: Product["createdAt"]) {
  const raw = getDateValue(value);
  if (!raw) return true;

  const millis = raw < 10000000000 ? raw * 1000 : raw;
  return Date.now() - millis < 7 * 86400000;
}

export default function ProductClient({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [favoriteId, setFavoriteId] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [sellerPostCount, setSellerPostCount] = useState(0);

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

      const relatedQueries: Query[] = [];

      if (data.categoria) {
        relatedQueries.push(query(collection(db, "posts"), where("categoria", "==", data.categoria), limit(12)));
      }

      if (data.ciudad) {
        relatedQueries.push(query(collection(db, "posts"), where("ciudad", "==", data.ciudad), limit(12)));
      }

      const relatedResults = await Promise.allSettled(relatedQueries.map((relatedQuery) => getDocs(relatedQuery)));
      const relatedMap = new Map<string, Product>();

      relatedResults.forEach((result) => {
        if (result.status !== "fulfilled") return;

        result.value.docs.forEach((document) => {
          const item = { id: document.id, ...document.data() } as Product;
          if (item.id !== data.id && (item.status || "active") === "active") {
            relatedMap.set(item.id, item);
          }
        });
      });

      setRelatedProducts(Array.from(relatedMap.values()).slice(0, 8));

      if (data.userId) {
        const sellerPostsQuery = query(collection(db, "posts"), where("userId", "==", data.userId), limit(40));
        const sellerPostsSnapshot = await getDocs(sellerPostsQuery);
        setSellerPostCount(
          sellerPostsSnapshot.docs.filter((document) => {
            const item = document.data() as Product;
            return (item.status || "active") === "active";
          }).length
        );
      }

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
    trackEvent(analyticsEvents.viewProduct, {
      product_id: product.id,
      category: product.categoria,
      premium: Boolean(product.featured),
    });
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
        trackEvent(analyticsEvents.removeFavoriteProduct, { product_id: product.id, category: product.categoria });
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
      trackEvent(analyticsEvents.favoriteProduct, { product_id: product.id, category: product.categoria });

      if (product.userId && product.userId !== auth.currentUser.uid) {
        const actorName = await getNotificationActorName(db, auth.currentUser);

        await addDoc(collection(db, "notifications"), {
          userId: product.userId,
          actorId: auth.currentUser.uid,
          actorName,
          productId: product.id,
          productTitle: product.titulo || "tu producto",
          title: "Nuevo favorito",
          message: `${actorName} guardó tu producto en favoritos.`,
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
        trackEvent("share", { product_id: product.id, method: "native", content_type: "product" });
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      trackEvent("share", { product_id: product.id, method: "clipboard", content_type: "product" });
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

  if (loading) {
    return (
      <main style={centerPage}>
        <span style={loadingPill}>Cargando producto...</span>
      </main>
    );
  }
  if (!product) return <main style={centerPage}>Producto no encontrado</main>;

  const selectedImage = images[activeImage] || "/placeholder.png";
  const isSold = product.status === "sold";
  const publishedAge = formatPublishedAge(product.createdAt);
  const recentlyPublished = isRecentlyPublished(product.createdAt);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.titulo || "Producto en YaVendelo",
    description: product.descripcion || "Producto publicado en YaVendelo",
    image: images.length ? images : [selectedImage],
    category: product.categoria,
    offers: {
      "@type": "Offer",
      priceCurrency: "MXN",
      price: Number(product.precio || 0),
      availability: isSold ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://yavendeloapp.com"}/producto/${product.id}`,
    },
  };

  return (
    <>
      <TopBar />

      <main className="fade-in" style={pageStyle}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="product-layout" style={containerStyle}>
          <section className="gallery-card" style={galleryCard}>
            <div className="main-image-wrap" style={mainImageWrap}>
              <div style={galleryOverlayTop}>
                {product.featured && <span style={premiumBadge}>Destacado</span>}
                <span style={imageCounter}>
                  {activeImage + 1} / {Math.max(images.length, 1)}
                </span>
              </div>
              <img
                src={selectedImage}
                alt={product.titulo || "Producto"}
                style={productImage}
                decoding="async"
                loading="eager"
              />

              {images.length > 1 && (
                <>
                  <button type="button" onClick={prevImage} style={leftArrow} aria-label="Imagen anterior">
                    ‹
                  </button>
                  <button type="button" onClick={nextImage} style={rightArrow} aria-label="Siguiente imagen">
                    ›
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="thumbs-row" style={thumbsGrid}>
                {images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    style={{
                      ...thumbButton,
                      border: activeImage === index ? "2px solid #ff7b00" : "1px solid rgba(255,255,255,0.1)",
                      opacity: activeImage === index ? 1 : 0.72,
                    }}
                    aria-label={`Ver imagen ${index + 1}`}
                  >
                    <img src={image} alt={`Imagen ${index + 1}`} style={thumbImage} loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section style={summaryCard}>
            <div style={badgesRow}>
              <span style={isSold ? soldBadge : availableBadge}>{isSold ? "Vendido" : "Disponible"}</span>
              {recentlyPublished && <span style={newBadge}>Publicado recientemente</span>}
              <span style={categoryBadge}>{product.categoria || "Producto"}</span>
              {product.featured && <span style={premiumSmallBadge}>Destacado</span>}
            </div>

            <h1 style={productTitle}>{product.titulo || "Producto disponible"}</h1>
            <p style={priceStyle}>{formatPrice(product.precio)}</p>
            <div style={locationRow}>
              <span aria-hidden="true">📍</span>
              <p style={cityStyle}>{product.ciudad || "México"}</p>
              <span style={dotStyle}>•</span>
              <p style={publishedStyle}>{publishedAge}</p>
            </div>

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

            <SafeTradeNote compact />

            <div className="product-actions" style={actionsRow}>
              {!isSold && (
                <div style={primaryActionWrap}>
                  <StartChatButton
                    productId={product.id}
                    productTitle={product.titulo}
                    sellerId={product.userId}
                    sellerName={product.userName}
                    sellerPhotoURL={product.userPhotoURL}
                    productImage={selectedImage}
                  />
                </div>
              )}

              <button type="button" onClick={toggleFavorite} style={liked ? dangerButton : secondaryButton}>
                {liked ? "Guardado" : "Guardar"}
              </button>

              <button type="button" onClick={shareProduct} style={secondaryButton}>
                Compartir
              </button>

              <ReportButton product={product} />
            </div>

            <article style={sellerCard}>
              <div style={cardHeader}>
                <div>
                  <span style={sellerLabel}>Información del vendedor</span>
                  <h2 style={sectionTitle}>Vendedor</h2>
                </div>
                <span style={sellerBadge}>Miembro YaVendelo</span>
              </div>
              <div style={sellerIdentity}>
                <UserAvatar
                  name={product.userName}
                  email={product.userEmail}
                  photoURL={product.userPhotoURL}
                  size={68}
                  label="Avatar del vendedor"
                />
                <div>
                  <h3 style={sellerName}>{product.userName || "Usuario"}</h3>
                  <p style={sellerEmail}>
                    {sellerPostCount > 0
                      ? `${sellerPostCount} publicaciones activas`
                      : "Vendedor con actividad en YaVendelo"}
                  </p>
                </div>
              </div>
              <div style={sellerBadges}>
                <span style={sellerBadge}>Chat directo</span>
                <span style={sellerBadge}>Perfil visible</span>
                <span style={sellerBadge}>Marketplace local</span>
              </div>

              {product.userEmail && (
                <Link href={`/vendedor/${encodeURIComponent(product.userEmail)}`} style={{ textDecoration: "none" }}>
                  <button type="button" style={profileButton}>
                    Ver perfil vendedor
                  </button>
                </Link>
              )}
            </article>

            <article style={descriptionCard}>
              <h2 style={sectionTitle}>Descripción</h2>
              <p style={descriptionStyle}>{product.descripcion || "Sin descripción disponible."}</p>
            </article>
          </section>
        </div>

        {relatedProducts.length > 0 && (
          <section style={relatedSection}>
            <div style={relatedHeader}>
              <div>
                <span style={sellerLabel}>Productos similares</span>
                <h2 style={sectionTitle}>También te puede interesar</h2>
              </div>
              <Link href={getCategoryHref(product.categoria || "")} style={{ textDecoration: "none" }}>
                <button type="button" style={secondaryButton}>Ver categoría</button>
              </Link>
            </div>
            <div style={relatedGrid}>
              {relatedProducts.map((item) => (
                <Link key={item.id} href={`/producto/${item.id}`} style={relatedCard}>
                  <img
                    src={item.imagen || item.imagenes?.[0] || "/placeholder.png"}
                    alt={item.titulo || "Producto relacionado"}
                    style={relatedImage}
                    loading="lazy"
                    decoding="async"
                  />
                  <div style={relatedBody}>
                    <strong>{item.titulo || "Producto disponible"}</strong>
                    <span>{formatPrice(item.precio)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <BottomNav />

        <style jsx>{`
          .gallery-card:hover .main-image-wrap :global(img) {
            transform: scale(1.025);
            filter: saturate(1.04);
          }

          .thumbs-row :global(button:hover) {
            transform: translateY(-2px);
            border-color: rgba(255, 123, 0, 0.58) !important;
          }

          .product-actions :global(button) {
            min-height: 52px;
          }

          a:hover :global(img) {
            transform: scale(1.025);
          }

          @media (max-width: 980px) {
            .product-layout {
              grid-template-columns: 1fr !important;
              gap: 20px !important;
            }

            .main-image-wrap {
              height: clamp(340px, 58vw, 440px) !important;
              max-height: 440px !important;
            }
          }

          @media (max-width: 760px) {
            .main-image-wrap {
              height: clamp(300px, 78vw, 380px) !important;
              max-height: 380px !important;
            }

            .product-actions {
              position: sticky;
              bottom: calc(94px + env(safe-area-inset-bottom));
              z-index: 20;
              padding: 10px !important;
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 8px;
              background: rgba(12, 12, 12, 0.9);
              backdrop-filter: blur(16px);
            }

            .product-actions :global(button),
            .product-actions :global(a) {
              flex: 1 1 140px;
            }
          }

          @media (hover: none) {
            .gallery-card:hover .main-image-wrap :global(img),
            a:hover :global(img) {
              transform: none;
            }
          }
        `}</style>
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
  padding: "30px 24px 150px",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "1240px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.08fr) minmax(380px, 0.92fr)",
  gap: "24px",
  alignItems: "start",
};

const centerPage: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, rgba(255,123,0,0.08), transparent 360px), #070707",
  color: "white",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontWeight: "900",
};

const loadingPill: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  borderRadius: "8px",
  padding: "16px 18px",
  boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
};

const galleryCard: React.CSSProperties = {
  overflow: "hidden",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.035))",
  boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
};

const mainImageWrap: React.CSSProperties = {
  position: "relative",
  width: "100%",
  height: "clamp(440px, 40vw, 510px)",
  maxHeight: "520px",
  background: "#101010",
  overflow: "hidden",
};

const galleryOverlayTop: React.CSSProperties = {
  position: "absolute",
  inset: "16px 16px auto 16px",
  zIndex: 4,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  pointerEvents: "none",
};

const productImage: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
  transition: "transform 0.45s ease, filter 0.45s ease",
};

const premiumBadge: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: "8px",
  background: "linear-gradient(135deg, #ffb067, #ff7b00)",
  color: "#101010",
  fontWeight: "900",
  boxShadow: "0 12px 26px rgba(255,123,0,0.28)",
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
  padding: "8px 10px",
  borderRadius: "8px",
  background: "rgba(0,0,0,0.58)",
  border: "1px solid rgba(255,255,255,0.12)",
  fontWeight: "900",
};

const thumbsGrid: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  padding: "12px 14px 14px",
  overflowX: "auto",
};

const thumbButton: React.CSSProperties = {
  width: "92px",
  height: "68px",
  flex: "0 0 auto",
  borderRadius: "8px",
  overflow: "hidden",
  background: "#101010",
  cursor: "pointer",
  padding: 0,
  transition: "opacity 0.2s ease, transform 0.2s ease, border-color 0.2s ease",
};

const thumbImage: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const summaryCard: React.CSSProperties = {
  display: "grid",
  gap: "16px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background:
    "linear-gradient(135deg, rgba(255,123,0,0.08), transparent 36%), linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.035))",
  padding: "24px",
  boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
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

const availableBadge: React.CSSProperties = {
  ...categoryBadge,
  background: "rgba(57,217,138,0.14)",
  border: "1px solid rgba(57,217,138,0.28)",
  color: "#9cf2c8",
};

const newBadge: React.CSSProperties = {
  ...categoryBadge,
  background: "rgba(255,255,255,0.08)",
  color: "#ffffff",
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
  fontSize: "clamp(30px, 3.4vw, 42px)",
  lineHeight: 1.08,
  fontWeight: "900",
};

const priceStyle: React.CSSProperties = {
  margin: 0,
  color: "#ffb067",
  fontSize: "clamp(38px, 4vw, 50px)",
  lineHeight: 1,
  fontWeight: "900",
  textShadow: "0 14px 34px rgba(255,123,0,0.18)",
};

const cityStyle: React.CSSProperties = {
  margin: 0,
  color: "#c7c7c7",
  fontWeight: "800",
};

const locationRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
};

const dotStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.34)",
};

const publishedStyle: React.CSSProperties = {
  margin: 0,
  color: "#a7a7a7",
  fontWeight: "800",
};

const statsRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))",
  gap: "10px",
};

const statPill: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.055)",
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

const primaryActionWrap: React.CSSProperties = {
  flex: "1 1 100%",
};

const cardStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.035))",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  padding: "22px",
};

const descriptionCard: React.CSSProperties = {
  ...cardStyle,
};

const cardHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "14px",
  flexWrap: "wrap",
  marginBottom: "12px",
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

const sellerIdentity: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginTop: "12px",
  marginBottom: "14px",
};

const sellerName: React.CSSProperties = {
  margin: "0 0 4px",
  fontSize: "22px",
  fontWeight: "900",
};

const sellerEmail: React.CSSProperties = {
  margin: 0,
  color: "#a7a7a7",
  overflowWrap: "anywhere",
};

const sellerBadges: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginBottom: "16px",
};

const sellerBadge: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.055)",
  color: "#d8d8d8",
  borderRadius: "8px",
  padding: "7px 9px",
  fontSize: "12px",
  fontWeight: "900",
};

const profileButton: React.CSSProperties = {
  border: "none",
  cursor: "pointer",
  background: "linear-gradient(135deg, #ffb067, #ff7b00)",
  color: "#101010",
  padding: "14px 18px",
  borderRadius: "8px",
  fontWeight: "900",
  width: "100%",
};

const secondaryButton: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.12)",
  cursor: "pointer",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  padding: "14px 18px",
  borderRadius: "8px",
  fontWeight: "900",
  minHeight: "48px",
  flex: "1 1 160px",
};

const dangerButton: React.CSSProperties = {
  ...secondaryButton,
  border: "none",
  background: "#ff3b30",
};

const relatedSection: React.CSSProperties = {
  width: "min(1180px, 100%)",
  margin: "26px auto 0",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.028))",
  borderRadius: "8px",
  padding: "22px",
};

const relatedHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  flexWrap: "wrap",
  marginBottom: "16px",
};

const relatedGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
  gap: "14px",
};

const relatedCard: React.CSSProperties = {
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.045)",
  borderRadius: "8px",
  color: "white",
  textDecoration: "none",
  transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
};

const relatedImage: React.CSSProperties = {
  width: "100%",
  height: "178px",
  objectFit: "cover",
  display: "block",
  transition: "transform 0.45s ease",
};

const relatedBody: React.CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: "14px",
};
