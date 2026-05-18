"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";

import { auth, db } from "../firebase/config";
import BottomNav from "../../components/BottomNav";
import TopBar from "../../components/TopBar";

type UserPost = {
  id: string;
  titulo?: string;
  precio?: number | string;
  ciudad?: string;
  categoria?: string;
  imagen?: string;
  imagenes?: string[];
  featured?: boolean;
  featuredUntil?: number;
  likes?: number;
  status?: string;
  views?: number;
};

function isPremiumActive(post: UserPost) {
  return post.featured === true && Number(post.featuredUntil || 0) > Date.now();
}

function getDaysLeft(featuredUntil?: number) {
  if (!featuredUntil) return 0;
  const diff = featuredUntil - Date.now();
  return diff <= 0 ? 0 : Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatPrice(value?: number | string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function PerfilPage() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPosts(userId: string) {
    try {
      const q = query(collection(db, "posts"), where("userId", "==", userId));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      })) as UserPost[];

      setPosts(data);
    } catch (error) {
      console.error("Error cargando perfil:", error);
      toast.error("Error cargando perfil");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setPosts([]);
        setLoading(false);
        return;
      }

      await loadPosts(currentUser.uid);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function activateBoostFromPayment() {
      const params = new URLSearchParams(window.location.search);
      const postId = localStorage.getItem("pendingBoostPostId");
      const plan = localStorage.getItem("pendingBoostPlan");

      if (params.get("payment") !== "success" || !postId || !plan || !auth.currentUser) return;

      try {
        const days = plan === "30days" ? 30 : 7;
        const featuredUntil = Date.now() + days * 24 * 60 * 60 * 1000;

        await updateDoc(doc(db, "posts", postId), {
          featured: true,
          featuredUntil,
          boostPlan: plan,
          boostPaid: true,
          boostedAt: Date.now(),
        });

        localStorage.removeItem("pendingBoostPostId");
        localStorage.removeItem("pendingBoostPlan");
        toast.success(`Boost activado por ${days} días`);
        await loadPosts(auth.currentUser.uid);
        window.history.replaceState({}, "", "/perfil");
      } catch (error) {
        console.error("Error activando boost:", error);
        toast.error("No se pudo activar el boost");
      }
    }

    activateBoostFromPayment();
  }, []);

  async function logout() {
    try {
      await signOut(auth);
      toast.success("Sesión cerrada");
      window.location.href = "/";
    } catch (error) {
      console.error("Error cerrando sesión:", error);
      toast.error("No se pudo cerrar sesión");
    }
  }

  async function togglePostStatus(postId: string, currentStatus?: string) {
    const nextStatus = currentStatus === "sold" ? "active" : "sold";

    try {
      await updateDoc(doc(db, "posts", postId), {
        status: nextStatus,
        statusUpdatedAt: Date.now(),
      });

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                status: nextStatus,
              }
            : post
        )
      );

      toast.success(nextStatus === "sold" ? "Producto marcado como vendido" : "Producto reactivado");
    } catch (error) {
      console.error("Error actualizando estado:", error);
      toast.error("No se pudo actualizar el producto");
    }
  }

  if (loading) return <main style={centerPage}>Cargando perfil...</main>;

  if (!user) {
    return (
      <>
        <TopBar />
        <main style={pageStyle}>
          <section style={emptyCard}>
            <span style={eyebrow}>Perfil</span>
            <h1 style={emptyTitle}>Inicia sesión para administrar tus publicaciones.</h1>
            <p style={emptyText}>Desde tu perfil puedes editar productos, destacar publicaciones y revisar tu actividad.</p>
            <Link href="/login" style={{ textDecoration: "none" }}>
              <button type="button" style={primaryButton}>
                Iniciar sesión
              </button>
            </Link>
          </section>
        </main>
        <BottomNav />
      </>
    );
  }

  const premiumPosts = posts.filter((post) => isPremiumActive(post)).length;
  const activePosts = posts.filter((post) => (post.status || "active") === "active").length;
  const soldPosts = posts.filter((post) => post.status === "sold").length;

  return (
    <>
      <TopBar />

      <main className="fade-in" style={pageStyle}>
        <section style={containerStyle}>
          <div style={profileCard}>
            <div style={avatar}>{user.email?.charAt(0).toUpperCase() || "U"}</div>
            <div style={{ flex: 1 }}>
              <span style={eyebrow}>Panel de vendedor</span>
              <h1 style={titleStyle}>{user.displayName || "Usuario"}</h1>
              <p style={subtitleStyle}>{user.email}</p>
              <div style={actionsRow}>
                <Link href="/publicar" style={{ textDecoration: "none" }}>
                  <button type="button" style={primaryButton}>Publicar producto</button>
                </Link>
                <Link href="/mensajes" style={{ textDecoration: "none" }}>
                  <button type="button" style={secondaryButton}>Mensajes</button>
                </Link>
                <Link href="/favoritos" style={{ textDecoration: "none" }}>
                  <button type="button" style={secondaryButton}>Favoritos</button>
                </Link>
                <button type="button" onClick={logout} style={dangerButton}>Salir</button>
              </div>
            </div>
          </div>

          <div style={statsGrid}>
            <Stat label="Publicaciones" value={posts.length} />
            <Stat label="Activas" value={activePosts} />
            <Stat label="Vendidas" value={soldPosts} />
            <Stat label="Premium activos" value={premiumPosts} />
          </div>

          <div style={sectionHeader}>
            <div>
              <span style={eyebrow}>Inventario</span>
              <h2 style={sectionTitle}>Tus publicaciones</h2>
              <p style={subtitleStyle}>Edita la información o destaca productos para aparecer primero.</p>
            </div>
          </div>

          {posts.length === 0 ? (
            <div style={emptyCard}>
              <span style={eyebrow}>Sin publicaciones</span>
              <h2 style={emptyTitle}>Publica tu primer producto.</h2>
              <p style={emptyText}>Agrega fotos reales, precio y una descripción clara para empezar a vender.</p>
              <Link href="/publicar" style={{ textDecoration: "none" }}>
                <button type="button" style={primaryButton}>Publicar ahora</button>
              </Link>
            </div>
          ) : (
            <section style={productsGrid}>
              {posts.map((post) => {
                const premiumActive = isPremiumActive(post);
                const daysLeft = getDaysLeft(post.featuredUntil);
                const image = post.imagen || post.imagenes?.[0] || "/placeholder.png";
                const isSold = post.status === "sold";

                return (
                  <article key={post.id} style={productCard}>
                    <Link href={`/producto/${post.id}`} style={{ color: "white", textDecoration: "none" }}>
                      <div style={mediaWrap}>
                        {premiumActive && <span style={premiumBadge}>Premium · {daysLeft} días</span>}
                        {isSold && <span style={soldBadge}>Vendido</span>}
                        <img src={image} alt={post.titulo || "Producto"} style={productImage} />
                      </div>
                      <div style={cardBody}>
                        <span style={categoryBadge}>{post.categoria || "Producto"}</span>
                        <h3 style={productTitle}>{post.titulo || "Producto disponible"}</h3>
                        <strong style={priceStyle}>{formatPrice(post.precio)}</strong>
                        <p style={cityStyle}>{post.ciudad || "México"}</p>
                        <p style={metaText}>
                          {Number(post.views || 0).toLocaleString("es-MX")} vistas ·{" "}
                          {Number(post.likes || 0).toLocaleString("es-MX")} guardados
                        </p>
                      </div>
                    </Link>
                    <div style={productActions}>
                      <Link href={`/editar/${post.id}`} style={{ flex: 1, textDecoration: "none" }}>
                        <button type="button" style={secondaryButtonFull}>Editar</button>
                      </Link>
                      <button
                        type="button"
                        onClick={() => togglePostStatus(post.id, post.status)}
                        style={isSold ? primaryButtonFull : soldButton}
                      >
                        {isSold ? "Reactivar" : "Vendido"}
                      </button>
                      {premiumActive ? (
                        <button type="button" style={premiumButton}>Premium activo</button>
                      ) : (
                        <Link
                          href={`/boost/${post.id}`}
                          style={{ flex: 1, textDecoration: "none" }}
                          onClick={() => {
                            localStorage.setItem("pendingBoostPostId", post.id);
                            localStorage.setItem("pendingBoostPlan", "7days");
                          }}
                        >
                          <button type="button" style={primaryButtonFull}>Destacar</button>
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </section>

        <BottomNav />
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={statCard}>
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

const centerPage: React.CSSProperties = {
  ...pageStyle,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontWeight: "900",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "1240px",
  margin: "0 auto",
};

const profileCard: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "22px",
  flexWrap: "wrap",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  padding: "28px",
  marginBottom: "20px",
};

const avatar: React.CSSProperties = {
  width: "96px",
  height: "96px",
  borderRadius: "8px",
  background: "#ff7b00",
  color: "#101010",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "42px",
  fontWeight: "900",
};

const eyebrow: React.CSSProperties = {
  display: "inline-flex",
  borderRadius: "8px",
  border: "1px solid rgba(255,123,0,0.22)",
  background: "rgba(255,123,0,0.12)",
  color: "#ffb067",
  padding: "9px 12px",
  fontWeight: "900",
  marginBottom: "14px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "46px",
  lineHeight: 1.05,
  fontWeight: "900",
};

const subtitleStyle: React.CSSProperties = {
  color: "#bdbdbd",
  lineHeight: 1.7,
  overflowWrap: "anywhere",
};

const actionsRow: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "18px",
};

const primaryButton: React.CSSProperties = {
  border: "none",
  background: "#ff7b00",
  color: "#101010",
  padding: "14px 16px",
  borderRadius: "8px",
  fontWeight: "900",
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  ...primaryButton,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
};

const dangerButton: React.CSSProperties = {
  ...primaryButton,
  background: "#ff3b30",
  color: "white",
};

const statsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
  gap: "14px",
  marginBottom: "30px",
};

const statCard: React.CSSProperties = {
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  padding: "20px",
};

const sectionHeader: React.CSSProperties = {
  marginBottom: "20px",
};

const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: "38px",
  fontWeight: "900",
};

const productsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
  gap: "18px",
};

const productCard: React.CSSProperties = {
  overflow: "hidden",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
};

const mediaWrap: React.CSSProperties = {
  position: "relative",
  height: "230px",
  background: "#101010",
};

const productImage: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const premiumBadge: React.CSSProperties = {
  position: "absolute",
  top: "12px",
  right: "12px",
  borderRadius: "8px",
  background: "#ff7b00",
  color: "#101010",
  padding: "8px 10px",
  fontSize: "12px",
  fontWeight: "900",
};

const soldBadge: React.CSSProperties = {
  ...premiumBadge,
  left: "12px",
  right: "auto",
  background: "#ff3b30",
  color: "white",
};

const cardBody: React.CSSProperties = {
  padding: "20px",
};

const categoryBadge: React.CSSProperties = {
  display: "inline-flex",
  borderRadius: "8px",
  background: "rgba(255,123,0,0.12)",
  color: "#ffb067",
  padding: "7px 9px",
  fontSize: "12px",
  fontWeight: "900",
  marginBottom: "12px",
};

const productTitle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: "22px",
  fontWeight: "900",
};

const priceStyle: React.CSSProperties = {
  display: "block",
  color: "#ffb067",
  fontSize: "26px",
  fontWeight: "900",
};

const cityStyle: React.CSSProperties = {
  color: "#a7a7a7",
  fontWeight: "800",
};

const metaText: React.CSSProperties = {
  color: "#8f8f8f",
  fontSize: "13px",
  margin: "8px 0 0",
};

const productActions: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  padding: "0 20px 20px",
};

const primaryButtonFull: React.CSSProperties = {
  ...primaryButton,
  width: "100%",
};

const secondaryButtonFull: React.CSSProperties = {
  ...secondaryButton,
  width: "100%",
};

const soldButton: React.CSSProperties = {
  ...dangerButton,
  flex: 1,
};

const premiumButton: React.CSSProperties = {
  ...secondaryButton,
  flex: 1,
  color: "#ffb067",
};

const emptyCard: React.CSSProperties = {
  maxWidth: "680px",
  margin: "0 auto",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  padding: "46px 24px",
  textAlign: "center",
};

const emptyTitle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: "34px",
  fontWeight: "900",
};

const emptyText: React.CSSProperties = {
  maxWidth: "520px",
  margin: "0 auto 24px",
  color: "#bdbdbd",
  lineHeight: 1.7,
};
