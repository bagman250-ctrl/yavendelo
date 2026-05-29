"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, onAuthStateChanged } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs, query, where } from "firebase/firestore";

import { auth, db } from "../firebase/config";
import BottomNav from "../../components/BottomNav";
import PremiumLoading from "../../components/PremiumLoading";
import TopBar from "../../components/TopBar";

type Favorite = {
  id: string;
  productId?: string;
  titulo?: string;
  precio?: number | string;
  imagen?: string;
  ciudad?: string;
  categoria?: string;
};

function formatPrice(value?: number | string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function FavoritosPage() {
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, "favorites"), where("userId", "==", currentUser.uid));
        const snapshot = await getDocs(q);
        const checkedFavorites = await Promise.all(
          snapshot.docs.map(async (document) => {
            const favorite = {
              id: document.id,
              ...document.data(),
            } as Favorite;

            if (!favorite.productId) return favorite;

            const productSnapshot = await getDoc(doc(db, "posts", favorite.productId));
            if (productSnapshot.exists()) return favorite;

            await deleteDoc(doc(db, "favorites", document.id));
            return null;
          })
        );

        setFavorites(checkedFavorites.filter(Boolean) as Favorite[]);
      } catch (error) {
        console.error("Error cargando favoritos:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <PremiumLoading label="Cargando favoritos..." />;

  if (!user) {
    return (
      <>
        <TopBar />
        <main style={pageStyle}>
          <section style={emptyCard}>
            <span style={eyebrow}>Favoritos</span>
            <h1 style={emptyTitle}>Inicia sesión para guardar productos.</h1>
            <p style={emptyText}>Tus favoritos se sincronizan con tu cuenta y quedan listos para comparar despues.</p>
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

  return (
    <>
      <TopBar />

      <main className="fade-in" style={pageStyle}>
        <section style={containerStyle}>
          <div style={headerStyle}>
            <div>
              <span style={eyebrow}>Guardados</span>
              <h1 style={titleStyle}>Tus favoritos</h1>
              <p style={subtitleStyle}>Productos que guardaste para revisar, comparar o contactar mas tarde.</p>
            </div>
            <Link href="/" style={{ textDecoration: "none" }}>
              <button type="button" style={secondaryButton}>
                Explorar mas
              </button>
            </Link>
          </div>

          {favorites.length === 0 ? (
            <div style={emptyCard}>
              <span style={eyebrow}>Sin favoritos</span>
              <h2 style={emptyTitle}>Aun no has guardado productos.</h2>
              <p style={emptyText}>Guarda opciones para comparar precio, ubicacion y vendedor antes de escribir.</p>
              <Link href="/" style={{ textDecoration: "none" }}>
                <button type="button" style={primaryButton}>
                  Ver productos
                </button>
              </Link>
            </div>
          ) : (
            <section style={gridStyle}>
              {favorites.map((item) => (
                <Link key={item.id} href={`/producto/${item.productId}`} style={cardLink}>
                  <article style={cardStyle}>
                    <img
                      src={item.imagen || "/placeholder.png"}
                      alt={item.titulo || "Producto guardado"}
                      style={imageStyle}
                      loading="lazy"
                      decoding="async"
                    />
                    <div style={cardBody}>
                      <span style={categoryBadge}>{item.categoria || "Producto"}</span>
                      <h2 style={cardTitle}>{item.titulo || "Producto disponible"}</h2>
                      <strong style={priceStyle}>{formatPrice(item.precio)}</strong>
                      <p style={cityStyle}>{item.ciudad || "México"}</p>
                    </div>
                  </article>
                </Link>
              ))}
            </section>
          )}
        </section>

        <BottomNav />
      </main>
    </>
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

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "end",
  gap: "20px",
  flexWrap: "wrap",
  marginBottom: "28px",
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
  maxWidth: "650px",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
  gap: "18px",
};

const cardLink: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
};

const cardStyle: React.CSSProperties = {
  overflow: "hidden",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.035))",
  transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
};

const imageStyle: React.CSSProperties = {
  width: "100%",
  height: "240px",
  objectFit: "cover",
  display: "block",
};

const cardBody: React.CSSProperties = {
  padding: "20px",
};

const categoryBadge: React.CSSProperties = {
  display: "inline-flex",
  borderRadius: "8px",
  background: "rgba(255,123,0,0.12)",
  border: "1px solid rgba(255,123,0,0.22)",
  color: "#ffb067",
  padding: "8px 10px",
  fontSize: "12px",
  fontWeight: "900",
  marginBottom: "14px",
};

const cardTitle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: "22px",
  fontWeight: "900",
};

const priceStyle: React.CSSProperties = {
  color: "#ffb067",
  fontSize: "26px",
  fontWeight: "900",
};

const cityStyle: React.CSSProperties = {
  color: "#a7a7a7",
  fontWeight: "800",
};

const emptyCard: React.CSSProperties = {
  maxWidth: "680px",
  margin: "0 auto",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.035))",
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

const primaryButton: React.CSSProperties = {
  border: "none",
  background: "linear-gradient(135deg, #ffb067, #ff7b00)",
  color: "#101010",
  padding: "15px 18px",
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
