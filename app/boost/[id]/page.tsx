"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../../firebase/config";
import BottomNav from "../../../components/BottomNav";
import TopBar from "../../../components/TopBar";
import { analyticsEvents, trackEvent } from "@/lib/analytics";
import { BOOST_PLANS, BoostPlanId } from "../../../lib/boostPlans";

type Post = {
  id: string;
  titulo?: string;
  precio?: number | string;
  ciudad?: string;
  categoria?: string;
  imagen?: string;
  imagenes?: string[];
  userId?: string;
};

function formatPrice(value?: number | string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function BoostPage() {
  const params = useParams<{ id: string }>();
  const postId = params.id;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState("");

  const loadPost = useCallback(async () => {
    try {
      const snapshot = await getDoc(doc(db, "posts", postId));

      if (snapshot.exists()) {
        setPost({ id: snapshot.id, ...snapshot.data() } as Post);
      }
    } catch (error) {
      console.error("Error cargando publicación:", error);
      toast.error("Error cargando publicación");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  async function createPayment(plan: BoostPlanId) {
    if (!auth.currentUser) {
      toast.error("Debes iniciar sesión");
      return;
    }

    if (!post) {
      toast.error("Publicación no encontrada");
      return;
    }

    if (post.userId !== auth.currentUser.uid) {
      toast.error("Solo puedes destacar tus propias publicaciones");
      return;
    }

    const planConfig = BOOST_PLANS.find((item) => item.id === plan);
    if (!planConfig) return;

    try {
      setProcessingPlan(plan);
      localStorage.setItem("pendingBoostPostId", post.id);
      localStorage.setItem("pendingBoostPlan", plan);
      trackEvent(analyticsEvents.boostClick, {
        product_id: post.id,
        plan,
        value: planConfig.price,
      });

      const response = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          title: post.titulo || "Producto YaVendelo",
          plan,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo crear el pago");

      const checkoutUrl = data.sandboxInitPoint || data.initPoint;
      if (!checkoutUrl) throw new Error("Mercado Pago no regresó URL de pago");

      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Error iniciando pago:", error);
      toast.error("No se pudo iniciar el pago");
    } finally {
      setProcessingPlan("");
    }
  }

  if (loading) return <main style={centerPage}>Cargando boost...</main>;
  if (!post) return <main style={centerPage}>Publicación no encontrada</main>;

  const image = post.imagen || post.imagenes?.[0] || "/placeholder.png";

  return (
    <>
      <TopBar />

      <main className="fade-in" style={pageStyle}>
        <section style={containerStyle}>
          <div style={heroCard}>
            <span style={eyebrow}>Boost premium</span>
            <h1 style={titleStyle}>Destaca tu publicación.</h1>
            <p style={subtitleStyle}>Aparece primero, resalta visualmente y aumenta oportunidades de recibir mensajes.</p>
          </div>

          <article style={productCard}>
            <img src={image} alt={post.titulo || "Producto"} style={productImage} />
            <div style={{ flex: 1 }}>
              <span style={categoryBadge}>{post.categoria || "Producto"}</span>
              <h2 style={productTitle}>{post.titulo || "Producto disponible"}</h2>
              <strong style={productPrice}>{formatPrice(post.precio)}</strong>
              <p style={productCity}>{post.ciudad || "México"}</p>
            </div>
          </article>

          <section style={plansGrid}>
            {BOOST_PLANS.map((plan) => (
              <article key={plan.id} style={plan.id === "30days" ? highlightedPlanCard : planCard}>
                <span style={planBadge}>{plan.badge}</span>
                <h2 style={planTitle}>{plan.label}</h2>
                <p style={planText}>{plan.text}</p>
                <strong style={priceStyle}>${plan.price} MXN</strong>
                <ul style={listStyle}>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => createPayment(plan.id)}
                  disabled={processingPlan !== ""}
                  style={{ ...primaryButton, opacity: processingPlan ? 0.7 : 1 }}
                >
                  {processingPlan === plan.id ? "Creando pago..." : `Comprar ${plan.label}`}
                </button>
              </article>
            ))}
          </section>

          <Link href="/perfil" style={{ textDecoration: "none" }}>
            <button type="button" style={secondaryButton}>
              Volver a mi perfil
            </button>
          </Link>
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

const centerPage: React.CSSProperties = {
  ...pageStyle,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontWeight: "900",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "1120px",
  margin: "0 auto",
};

const heroCard: React.CSSProperties = {
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.035))",
  padding: "30px",
  marginBottom: "18px",
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
  maxWidth: "680px",
};

const productCard: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "18px",
  flexWrap: "wrap",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.035))",
  padding: "16px",
  marginBottom: "18px",
};

const productImage: React.CSSProperties = {
  width: "180px",
  height: "150px",
  objectFit: "cover",
  borderRadius: "8px",
};

const categoryBadge: React.CSSProperties = {
  display: "inline-flex",
  borderRadius: "8px",
  background: "rgba(255,123,0,0.12)",
  color: "#ffb067",
  padding: "7px 9px",
  fontSize: "12px",
  fontWeight: "900",
  marginBottom: "10px",
};

const productTitle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: "28px",
  fontWeight: "900",
};

const productPrice: React.CSSProperties = {
  color: "#ffb067",
  fontSize: "26px",
  fontWeight: "900",
};

const productCity: React.CSSProperties = {
  color: "#a7a7a7",
  fontWeight: "800",
};

const plansGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
  gap: "18px",
  marginBottom: "18px",
};

const planCard: React.CSSProperties = {
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.035))",
  padding: "24px",
};

const highlightedPlanCard: React.CSSProperties = {
  ...planCard,
  border: "1px solid rgba(255,123,0,0.38)",
  boxShadow: "0 24px 70px rgba(255,123,0,0.12)",
};

const planBadge: React.CSSProperties = {
  ...eyebrow,
  marginBottom: "16px",
};

const planTitle: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: "36px",
  fontWeight: "900",
};

const planText: React.CSSProperties = {
  color: "#bdbdbd",
  lineHeight: 1.7,
};

const priceStyle: React.CSSProperties = {
  display: "block",
  color: "#ffb067",
  fontSize: "38px",
  fontWeight: "900",
  margin: "18px 0",
};

const listStyle: React.CSSProperties = {
  color: "#d4d4d4",
  lineHeight: 2,
  paddingLeft: "20px",
};

const primaryButton: React.CSSProperties = {
  width: "100%",
  border: "none",
  background: "linear-gradient(135deg, #ffb067, #ff7b00)",
  color: "#101010",
  padding: "15px 18px",
  borderRadius: "8px",
  fontWeight: "900",
  cursor: "pointer",
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
