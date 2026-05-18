"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";

import { db } from "../../firebase/config";
import BottomNav from "../../../components/BottomNav";
import TopBar from "../../../components/TopBar";
import { getCategoryBySlugOrLabel } from "@/lib/categories";

type CategoryPost = {
  id: string;
  titulo?: string;
  descripcion?: string;
  precio?: number | string;
  ciudad?: string;
  categoria?: string;
  imagen?: string;
  imagenes?: string[];
  featured?: boolean;
  status?: string;
};

function formatPrice(value?: number | string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const rawCategory = decodeURIComponent(params.slug || "");
  const knownCategory = getCategoryBySlugOrLabel(rawCategory);
  const categoryName = knownCategory?.label || rawCategory;
  const categoryIcon = knownCategory?.icon;
  const [posts, setPosts] = useState<CategoryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadPosts() {
      try {
        const snapshot = await getDocs(collection(db, "posts"));
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        })) as CategoryPost[];

        setPosts(data);
      } catch (error) {
        console.error("Error cargando categoría:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return posts
      .filter((post) => (post.status || "active") === "active")
      .filter((post) => post.categoria === categoryName)
      .filter((post) => {
        if (!searchText) return true;

        return (
          post.titulo?.toLowerCase().includes(searchText) ||
          post.descripcion?.toLowerCase().includes(searchText) ||
          post.ciudad?.toLowerCase().includes(searchText)
        );
      })
      .sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });
  }, [posts, categoryName, search]);

  return (
    <>
      <TopBar />

      <main className="fade-in" style={pageStyle}>
        <section style={containerStyle}>
          <div style={heroCard}>
            <span style={eyebrow}>Categoría</span>
            <h1 style={titleStyle}>{categoryIcon ? `${categoryIcon} ${categoryName}` : categoryName}</h1>
            <p style={subtitleStyle}>Explora productos publicados en esta categoría y filtra dentro de los resultados.</p>
            <input
              type="search"
              placeholder={`Buscar dentro de ${categoryName}...`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={searchInput}
            />
          </div>

          <div style={sectionHeader}>
            <div>
              <h2 style={sectionTitle}>Productos</h2>
              <p style={subtitleStyle}>
                {loading ? "Cargando productos..." : `${filteredPosts.length} resultado${filteredPosts.length === 1 ? "" : "s"}.`}
              </p>
            </div>
            <Link href="/" style={{ textDecoration: "none" }}>
              <button type="button" style={secondaryButton}>Volver al inicio</button>
            </Link>
          </div>

          {loading && <SkeletonGrid />}

          {!loading && filteredPosts.length === 0 && (
            <div style={emptyCard}>
              <span style={eyebrow}>Sin productos</span>
              <h2 style={emptyTitle}>Todavía no hay publicaciones aquí.</h2>
              <p style={emptyText}>Prueba otra búsqueda o vuelve al inicio para explorar más categorías.</p>
            </div>
          )}

          {!loading && filteredPosts.length > 0 && (
            <div style={productsGrid}>
              {filteredPosts.map((post) => {
                const image = post.imagen || post.imagenes?.[0] || "/placeholder.png";

                return (
                  <Link key={post.id} href={`/producto/${post.id}`} style={{ color: "white", textDecoration: "none" }}>
                    <article style={productCard}>
                      <div style={mediaWrap}>
                        {post.featured && <span style={premiumBadge}>Premium</span>}
                        <img src={image} alt={post.titulo || "Producto"} style={productImage} />
                      </div>
                      <div style={cardBody}>
                        <span style={categoryBadge}>{post.categoria || "Producto"}</span>
                        <h3 style={productTitle}>{post.titulo || "Producto disponible"}</h3>
                        <p style={descriptionText}>
                          {post.descripcion
                            ? `${post.descripcion.slice(0, 92)}${post.descripcion.length > 92 ? "..." : ""}`
                            : "Producto disponible en YaVendelo."}
                        </p>
                        <div style={productFooter}>
                          <strong>{formatPrice(post.precio)}</strong>
                          <span>{post.ciudad || "México"}</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <BottomNav />
      </main>
    </>
  );
}

function SkeletonGrid() {
  return (
    <div style={productsGrid}>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} style={productCard}>
          <div style={skeletonImage} />
          <div style={cardBody}>
            <div style={{ ...skeletonLine, width: "70%", height: "24px" }} />
            <div style={{ ...skeletonLine, width: "95%" }} />
            <div style={{ ...skeletonLine, width: "55%" }} />
          </div>
        </div>
      ))}
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
};

const heroCard: React.CSSProperties = {
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  padding: "30px",
  marginBottom: "24px",
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
  fontSize: "48px",
  lineHeight: 1.05,
  fontWeight: "900",
};

const subtitleStyle: React.CSSProperties = {
  color: "#bdbdbd",
  lineHeight: 1.7,
};

const searchInput: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  marginTop: "12px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "#101010",
  color: "white",
  borderRadius: "8px",
  padding: "15px",
  outline: "none",
  fontSize: "15px",
};

const sectionHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "end",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "16px",
  marginBottom: "18px",
};

const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: "36px",
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
  height: "240px",
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
  margin: "0 0 10px",
  fontSize: "22px",
  fontWeight: "900",
};

const descriptionText: React.CSSProperties = {
  color: "#a7a7a7",
  lineHeight: 1.6,
};

const productFooter: React.CSSProperties = {
  display: "flex",
  alignItems: "end",
  justifyContent: "space-between",
  gap: "12px",
};

const emptyCard: React.CSSProperties = {
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  padding: "46px 24px",
  textAlign: "center",
};

const emptyTitle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: "32px",
  fontWeight: "900",
};

const emptyText: React.CSSProperties = {
  color: "#bdbdbd",
  lineHeight: 1.7,
};

const secondaryButton: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  padding: "14px 16px",
  borderRadius: "8px",
  fontWeight: "900",
  cursor: "pointer",
};

const skeletonImage: React.CSSProperties = {
  height: "240px",
  background: "rgba(255,255,255,0.08)",
};

const skeletonLine: React.CSSProperties = {
  height: "16px",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.1)",
  marginBottom: "12px",
};
