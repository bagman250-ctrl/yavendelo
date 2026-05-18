"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { auth, db } from "@/app/firebase/config";
import BottomNav from "@/components/BottomNav";
import ProductCard from "@/components/ProductCard";
import TopBar from "@/components/TopBar";

type TimeLike =
  | number
  | Date
  | {
      toMillis: () => number;
    }
  | null
  | undefined;

type SellerPost = {
  id: string;
  titulo?: string;
  descripcion?: string;
  precio?: number | string;
  imagen?: string;
  imagenes?: string[];
  ciudad?: string;
  categoria?: string;
  featured?: boolean;
  featuredUntil?: TimeLike;
  likes?: number;
};

type Review = {
  id: string;
  user?: string | null;
  userId?: string;
  comment?: string;
  rating?: number;
  sellerEmail?: string;
  createdAt?: TimeLike;
};

function getMillis(value: TimeLike) {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  return value.toMillis();
}

function isPremiumActive(post: SellerPost) {
  return post.featured === true && getMillis(post.featuredUntil) > Date.now();
}

export default function VendedorPage() {
  const params = useParams<{ email: string }>();
  const email = decodeURIComponent(params.email || "");
  const [posts, setPosts] = useState<SellerPost[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const postsQuery = query(
          collection(db, "posts"),
          where("userEmail", "==", email)
        );
        const reviewsQuery = query(
          collection(db, "reviews"),
          where("sellerEmail", "==", email)
        );

        const [postsSnapshot, reviewsSnapshot] = await Promise.all([
          getDocs(postsQuery),
          getDocs(reviewsQuery),
        ]);

        const postsData = postsSnapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        })) as SellerPost[];

        const reviewsData = reviewsSnapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        })) as Review[];

        setPosts(
          postsData.sort((a, b) => {
            if (isPremiumActive(a) && !isPremiumActive(b)) return -1;
            if (!isPremiumActive(a) && isPremiumActive(b)) return 1;
            return 0;
          })
        );

        setReviews(
          reviewsData.sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt))
        );
      } catch (error) {
        console.error("Error cargando vendedor:", error);
        toast.error("Error cargando vendedor");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [email]);

  async function submitReview() {
    const currentUser = auth.currentUser;
    const cleanComment = comment.trim();

    if (!currentUser) {
      toast.error("Debes iniciar sesion");
      return;
    }

    if (currentUser.email === email) {
      toast.error("No puedes reseñar tu propio perfil");
      return;
    }

    if (cleanComment.length < 12) {
      toast.error("Escribe una reseña mas clara");
      return;
    }

    try {
      setSubmitting(true);

      const reviewData = {
        sellerEmail: email,
        user: currentUser.email,
        userId: currentUser.uid,
        comment: cleanComment,
        rating,
        createdAt: serverTimestamp(),
      };

      const reviewRef = await addDoc(collection(db, "reviews"), reviewData);

      setReviews((prev) => [
        {
          id: reviewRef.id,
          ...reviewData,
          createdAt: Date.now(),
        },
        ...prev,
      ]);
      setComment("");
      setRating(5);
      toast.success("Reseña publicada");
    } catch (error) {
      console.error("Error publicando reseña:", error);
      toast.error("No se pudo publicar la reseña");
    } finally {
      setSubmitting(false);
    }
  }

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return "0.0";

    return (
      reviews.reduce((acc, review) => acc + Number(review.rating || 0), 0) /
      reviews.length
    ).toFixed(1);
  }, [reviews]);

  const featuredCount = posts.filter(isPremiumActive).length;
  const reputation =
    Number(averageRating) >= 4.8
      ? "Excelente"
      : Number(averageRating) >= 4
        ? "Muy confiable"
        : reviews.length > 0
          ? "En crecimiento"
          : "Nuevo vendedor";

  if (loading) {
    return <main style={centerPage}>Cargando vendedor...</main>;
  }

  return (
    <>
      <TopBar />

      <main className="fade-in" style={pageStyle}>
        <section style={containerStyle}>
          <section style={profileCard}>
            <div style={avatar}>{email.charAt(0).toUpperCase()}</div>

            <div style={{ flex: 1 }}>
              <span style={eyebrow}>Perfil vendedor</span>
              <h1 style={titleStyle}>Vendedor</h1>
              <p style={emailStyle}>{email}</p>

              <div style={statsGrid}>
                <Stat label="Productos" value={posts.length} />
                <Stat label="Destacados" value={featuredCount} />
                <Stat label="Reseñas" value={reviews.length} />
                <Stat label="Rating" value={averageRating} />
              </div>
            </div>

            <div style={trustCard}>
              <span style={trustLabel}>Reputacion</span>
              <strong style={trustValue}>{reputation}</strong>
              <p style={mutedText}>
                Revisa publicaciones y reseñas antes de cerrar una compra.
              </p>
            </div>
          </section>

          <section style={columnsGrid}>
            <section style={panelStyle}>
              <h2 style={sectionTitle}>Escribir reseña</h2>
              <p style={mutedText}>
                Comparte una experiencia real para ayudar a otros compradores.
              </p>

              <select
                value={rating}
                onChange={(event) => setRating(Number(event.target.value))}
                style={inputStyle}
              >
                <option value={5}>5 - Excelente</option>
                <option value={4}>4 - Muy bueno</option>
                <option value={3}>3 - Bueno</option>
                <option value={2}>2 - Regular</option>
                <option value={1}>1 - Malo</option>
              </select>

              <textarea
                placeholder="Describe como fue tu experiencia"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                style={textareaStyle}
              />

              <button
                type="button"
                onClick={submitReview}
                disabled={submitting}
                style={{ ...primaryButton, opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? "Publicando..." : "Publicar reseña"}
              </button>
            </section>

            <section style={panelStyle}>
              <h2 style={sectionTitle}>Reseñas</h2>

              {reviews.length === 0 ? (
                <EmptyState text="Este vendedor todavia no tiene reseñas." />
              ) : (
                <div style={listStyle}>
                  {reviews.slice(0, 5).map((review) => (
                    <article key={review.id} style={reviewCard}>
                      <div style={reviewHeader}>
                        <strong>{review.rating || 0}/5</strong>
                        <span style={reviewUser}>{review.user || "Usuario"}</span>
                      </div>
                      <p style={reviewText}>{review.comment}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </section>

          <section style={sectionBlock}>
            <div style={sectionHeader}>
              <div>
                <h2 style={sectionTitle}>Publicaciones</h2>
                <p style={mutedText}>Productos publicados por este vendedor.</p>
              </div>

              <Link href="/" style={{ textDecoration: "none" }}>
                <button type="button" style={secondaryButton}>
                  Explorar mas
                </button>
              </Link>
            </div>

            {posts.length === 0 ? (
              <EmptyState text="Este vendedor todavia no tiene productos publicados." />
            ) : (
              <div style={productsGrid}>
                {posts.map((post) => (
                  <ProductCard key={post.id} product={post} />
                ))}
              </div>
            )}
          </section>
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

function EmptyState({ text }: { text: string }) {
  return <div style={emptyState}>{text}</div>;
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "linear-gradient(180deg, rgba(255,123,0,0.08), transparent 360px), #070707",
  color: "white",
  padding: "42px 24px 140px",
};

const centerPage: React.CSSProperties = {
  ...pageStyle,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "900",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "1180px",
  margin: "0 auto",
};

const profileCard: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  borderRadius: "8px",
  padding: "24px",
  marginBottom: "18px",
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
  padding: "8px 10px",
  fontSize: "12px",
  fontWeight: "900",
};

const titleStyle: React.CSSProperties = {
  margin: "10px 0 6px",
  fontSize: "42px",
  lineHeight: 1.08,
  fontWeight: "900",
};

const emailStyle: React.CSSProperties = {
  color: "#bdbdbd",
  overflowWrap: "anywhere",
  margin: "0 0 16px",
};

const statsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))",
  gap: "10px",
};

const statCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  borderRadius: "8px",
  padding: "12px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const trustCard: React.CSSProperties = {
  width: "min(100%, 270px)",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(0,0,0,0.24)",
  borderRadius: "8px",
  padding: "16px",
};

const trustLabel: React.CSSProperties = {
  display: "block",
  color: "#a7a7a7",
  fontSize: "13px",
  fontWeight: "800",
  marginBottom: "8px",
};

const trustValue: React.CSSProperties = {
  display: "block",
  fontSize: "24px",
  color: "#ffb067",
  marginBottom: "8px",
};

const columnsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(360px,100%),1fr))",
  gap: "18px",
  marginBottom: "18px",
};

const panelStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  borderRadius: "8px",
  padding: "22px",
};

const sectionBlock: React.CSSProperties = {
  ...panelStyle,
  marginBottom: "18px",
};

const sectionHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const sectionTitle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: "28px",
  fontWeight: "900",
};

const mutedText: React.CSSProperties = {
  color: "#a7a7a7",
  lineHeight: 1.65,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.24)",
  color: "white",
  borderRadius: "8px",
  padding: "13px 14px",
  outline: "none",
  margin: "14px 0",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "130px",
  resize: "vertical",
  lineHeight: 1.55,
};

const primaryButton: React.CSSProperties = {
  border: "none",
  cursor: "pointer",
  background: "#ff7b00",
  color: "#101010",
  padding: "13px 16px",
  borderRadius: "8px",
  fontWeight: "900",
};

const secondaryButton: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.12)",
  cursor: "pointer",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  padding: "13px 16px",
  borderRadius: "8px",
  fontWeight: "900",
};

const listStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const reviewCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  borderRadius: "8px",
  padding: "14px",
};

const reviewHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "8px",
};

const reviewUser: React.CSSProperties = {
  color: "#a7a7a7",
  overflowWrap: "anywhere",
};

const reviewText: React.CSSProperties = {
  color: "#d4d4d4",
  lineHeight: 1.65,
  margin: 0,
};

const productsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
  gap: "16px",
};

const emptyState: React.CSSProperties = {
  border: "1px dashed rgba(255,255,255,0.16)",
  borderRadius: "8px",
  padding: "24px",
  color: "#a7a7a7",
  textAlign: "center",
  fontWeight: "800",
};
