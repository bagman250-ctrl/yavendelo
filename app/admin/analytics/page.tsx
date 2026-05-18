"use client";

import { CSSProperties, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { User, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

import { auth, db } from "@/app/firebase/config";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import { isAdminEmail } from "@/lib/admin";

type TimeLike =
  | number
  | Date
  | {
      toMillis: () => number;
    }
  | null
  | undefined;

type Post = {
  id: string;
  categoria?: string;
  ciudad?: string;
  featured?: boolean;
  featuredUntil?: TimeLike;
  status?: string;
  views?: number;
  likes?: number;
  createdAt?: TimeLike;
};

type RecordItem = {
  id: string;
  [key: string]: unknown;
};

function getMillis(value: TimeLike) {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  return value.toMillis();
}

function isPremiumActive(post: Post) {
  return post.featured === true && getMillis(post.featuredUntil) > Date.now();
}

function percent(value: number, base: number) {
  if (!base) return "0%";
  return `${Math.round((value / base) * 100)}%`;
}

export default function AdminAnalyticsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<RecordItem[]>([]);
  const [reports, setReports] = useState<RecordItem[]>([]);
  const [favorites, setFavorites] = useState<RecordItem[]>([]);
  const [conversations, setConversations] = useState<RecordItem[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (isAdminEmail(currentUser?.email)) {
        await loadAnalytics();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function loadAnalytics() {
    try {
      setLoading(true);

      const [postsResult, usersResult, reportsResult, favoritesResult, conversationsResult] =
        await Promise.allSettled([
          getDocs(collection(db, "posts")),
          getDocs(collection(db, "users")),
          getDocs(collection(db, "reports")),
          getDocs(collection(db, "favorites")),
          getDocs(collection(db, "conversations")),
        ]);

      if (postsResult.status === "fulfilled") {
        setPosts(
          postsResult.value.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          })) as Post[]
        );
      } else {
        toast.error("No se pudieron cargar publicaciones");
      }

      if (usersResult.status === "fulfilled") {
        setUsers(usersResult.value.docs.map((document) => ({ id: document.id, ...document.data() })));
      }

      if (reportsResult.status === "fulfilled") {
        setReports(reportsResult.value.docs.map((document) => ({ id: document.id, ...document.data() })));
      }

      if (favoritesResult.status === "fulfilled") {
        setFavorites(favoritesResult.value.docs.map((document) => ({ id: document.id, ...document.data() })));
      }

      if (conversationsResult.status === "fulfilled") {
        setConversations(
          conversationsResult.value.docs.map((document) => ({ id: document.id, ...document.data() }))
        );
      }
    } catch (error) {
      console.error("Error cargando analytics:", error);
      toast.error("Error cargando analytics");
    } finally {
      setLoading(false);
    }
  }

  const isAdmin = isAdminEmail(user?.email);

  if (authLoading || loading) {
    return (
      <main style={loadingPage}>
        <span style={loadingBox}>Cargando analytics...</span>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <TopBar />
        <main style={blockedPage}>
          <section style={blockedCard}>
            <span style={eyebrow}>Analytics</span>
            <h1 style={blockedTitle}>Acceso restringido</h1>
            <p style={mutedText}>No tienes permisos para ver estas metricas.</p>
            <Link href="/" style={{ textDecoration: "none" }}>
              <button type="button" style={primaryButton}>
                Volver al inicio
              </button>
            </Link>
          </section>
        </main>
        <BottomNav />
      </>
    );
  }

  const activePosts = posts.filter((post) => post.status !== "deleted").length;
  const featuredPosts = posts.filter(isPremiumActive).length;
  const totalViews = posts.reduce((acc, post) => acc + Number(post.views || 0), 0);
  const totalLikes = posts.reduce((acc, post) => acc + Number(post.likes || 0), 0);
  const pendingReports = reports.filter((report) => report.status !== "resolved").length;
  const engagement = favorites.length + conversations.length;
  const conversionRate = percent(conversations.length, posts.length);
  const lastWeek = Date.now() - 7 * 86400000;
  const postsThisWeek = posts.filter((post) => getMillis(post.createdAt) >= lastWeek).length;

  const categoryRows = getTopRows(posts, "categoria", "Sin categoria");
  const cityRows = getTopRows(posts, "ciudad", "Sin ciudad");

  return (
    <>
      <TopBar />

      <main className="fade-in" style={pageStyle}>
        <section style={containerStyle}>
          <section style={heroSection}>
            <div>
              <span style={eyebrow}>Analytics</span>
              <h1 style={heroTitle}>Metricas YaVendelo</h1>
              <p style={heroText}>
                Vista ejecutiva de crecimiento, actividad, inventario y confianza.
              </p>
            </div>

            <div style={heroActions}>
              <Link href="/admin" style={{ textDecoration: "none" }}>
                <button type="button" style={secondaryButton}>
                  Volver al admin
                </button>
              </Link>
              <button type="button" onClick={loadAnalytics} style={primaryButton}>
                Actualizar
              </button>
            </div>
          </section>

          <section style={statsGrid}>
            <MetricCard title="Publicaciones" value={posts.length} detail={`${activePosts} activas`} />
            <MetricCard title="Nuevas 7 dias" value={postsThisWeek} detail="Ritmo reciente" />
            <MetricCard title="Premium" value={featuredPosts} detail={`${percent(featuredPosts, posts.length)} del inventario`} />
            <MetricCard title="Usuarios" value={users.length} detail="Cuentas registradas" />
            <MetricCard title="Favoritos" value={favorites.length} detail="Intencion guardada" />
            <MetricCard title="Conversaciones" value={conversations.length} detail={`${conversionRate} por publicacion`} />
            <MetricCard title="Reportes" value={reports.length} detail={`${pendingReports} pendientes`} />
            <MetricCard title="Vistas" value={totalViews} detail={`${totalLikes} likes/guardados`} />
          </section>

          <section style={columnsGrid}>
            <Panel title="Senales principales">
              <div style={signalsGrid}>
                <Signal title="Engagement" value={engagement} text="Favoritos y conversaciones generadas." />
                <Signal title="Demanda" value={totalViews} text="Vistas acumuladas en publicaciones." />
                <Signal title="Moderacion" value={pendingReports} text="Reportes pendientes por revisar." />
              </div>
            </Panel>

            <Panel title="Salud del marketplace">
              <div style={healthList}>
                <HealthRow label="Inventario premium" value={percent(featuredPosts, posts.length)} />
                <HealthRow label="Conversaciones por publicacion" value={conversionRate} />
                <HealthRow label="Reportes pendientes" value={String(pendingReports)} />
                <HealthRow label="Actividad semanal" value={String(postsThisWeek)} />
              </div>
            </Panel>
          </section>

          <section style={columnsGrid}>
            <Panel title="Top categorias">
              <BarList rows={categoryRows} />
            </Panel>

            <Panel title="Top ciudades">
              <BarList rows={cityRows} />
            </Panel>
          </section>
        </section>

        <BottomNav />
      </main>
    </>
  );
}

function MetricCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: number;
  detail: string;
}) {
  return (
    <article style={metricCard}>
      <span style={metricLabel}>{title}</span>
      <strong style={metricValue}>{value.toLocaleString("es-MX")}</strong>
      <span style={metricDetail}>{detail}</span>
    </article>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={panelStyle}>
      <h2 style={sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

function Signal({ title, value, text }: { title: string; value: number; text: string }) {
  return (
    <article style={signalCard}>
      <span style={signalTitle}>{title}</span>
      <strong style={signalValue}>{value.toLocaleString("es-MX")}</strong>
      <p style={signalText}>{text}</p>
    </article>
  );
}

function HealthRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={healthRow}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function BarList({ rows }: { rows: { name: string; count: number }[] }) {
  if (rows.length === 0) {
    return (
      <div style={emptyState}>
        <span style={emptyStateBadge}>Sin muestra</span>
        <strong>Sin datos suficientes.</strong>
        <p>Las barras aparecerán cuando existan publicaciones con categoría o ciudad.</p>
      </div>
    );
  }

  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <div style={barList}>
      {rows.map((row) => (
        <div key={row.name} style={barRow}>
          <div style={barHeader}>
            <span>{row.name}</span>
            <strong>{row.count}</strong>
          </div>
          <div style={barTrack}>
            <div style={{ ...barFill, width: `${Math.max(8, (row.count / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function getTopRows(posts: Post[], key: "categoria" | "ciudad", fallback: string) {
  const map: Record<string, number> = {};

  posts.forEach((post) => {
    const name = post[key] || fallback;
    map[name] = (map[name] || 0) + 1;
  });

  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, rgba(255,123,0,0.08), transparent 360px), #070707",
  color: "white",
  padding: "42px 24px 140px",
};

const loadingPage: CSSProperties = {
  ...pageStyle,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const loadingBox: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  borderRadius: "8px",
  padding: "18px 20px",
  fontWeight: "900",
};

const containerStyle: CSSProperties = {
  maxWidth: "1360px",
  margin: "0 auto",
};

const heroSection: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: "18px",
  flexWrap: "wrap",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.035))",
  borderRadius: "8px",
  padding: "30px",
  marginBottom: "18px",
};

const heroTitle: CSSProperties = {
  margin: "10px 0",
  fontSize: "48px",
  lineHeight: 1.05,
  fontWeight: "900",
};

const heroText: CSSProperties = {
  margin: 0,
  color: "#bdbdbd",
  lineHeight: 1.7,
};

const heroActions: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const statsGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
  gap: "14px",
  marginBottom: "18px",
};

const metricCard: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.1)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.065), rgba(255,255,255,0.035))",
  borderRadius: "8px",
  padding: "18px",
  boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
};

const metricLabel: CSSProperties = {
  display: "block",
  color: "#a7a7a7",
  fontWeight: "800",
  fontSize: "13px",
  marginBottom: "10px",
};

const metricValue: CSSProperties = {
  display: "block",
  fontSize: "34px",
  fontWeight: "900",
  marginBottom: "6px",
};

const metricDetail: CSSProperties = {
  color: "#ffb067",
  fontSize: "13px",
  fontWeight: "800",
};

const columnsGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(360px,100%),1fr))",
  gap: "18px",
  marginBottom: "18px",
};

const panelStyle: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.1)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.028))",
  borderRadius: "8px",
  padding: "22px",
};

const sectionTitle: CSSProperties = {
  margin: "0 0 18px",
  fontSize: "28px",
  fontWeight: "900",
};

const signalsGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
  gap: "14px",
};

const signalCard: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.045)",
  borderRadius: "8px",
  padding: "18px",
};

const signalTitle: CSSProperties = {
  display: "block",
  color: "#ffb067",
  fontWeight: "900",
  marginBottom: "10px",
};

const signalValue: CSSProperties = {
  display: "block",
  fontSize: "34px",
  fontWeight: "900",
  marginBottom: "8px",
};

const signalText: CSSProperties = {
  color: "#a7a7a7",
  lineHeight: 1.6,
  margin: 0,
};

const healthList: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const healthRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  borderRadius: "8px",
  padding: "14px",
};

const barList: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

const barRow: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const barHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  fontWeight: "800",
};

const barTrack: CSSProperties = {
  height: "10px",
  background: "rgba(255,255,255,0.08)",
  borderRadius: "999px",
  overflow: "hidden",
};

const barFill: CSSProperties = {
  height: "100%",
  background: "linear-gradient(90deg, #ffb067, #ff7b00)",
  borderRadius: "999px",
};

const primaryButton: CSSProperties = {
  border: "none",
  cursor: "pointer",
  background: "linear-gradient(135deg, #ffb067, #ff7b00)",
  color: "#101010",
  padding: "13px 16px",
  borderRadius: "8px",
  fontWeight: "900",
};

const secondaryButton: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.12)",
  cursor: "pointer",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  padding: "13px 16px",
  borderRadius: "8px",
  fontWeight: "900",
};

const blockedPage: CSSProperties = {
  ...pageStyle,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const blockedCard: CSSProperties = {
  width: "100%",
  maxWidth: "520px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  borderRadius: "8px",
  padding: "30px",
  textAlign: "center",
};

const blockedTitle: CSSProperties = {
  margin: "10px 0",
  fontSize: "36px",
  lineHeight: 1.1,
  fontWeight: "900",
};

const mutedText: CSSProperties = {
  color: "#a7a7a7",
  lineHeight: 1.6,
  marginBottom: "20px",
};

const eyebrow: CSSProperties = {
  display: "inline-flex",
  borderRadius: "8px",
  border: "1px solid rgba(255,123,0,0.22)",
  background: "rgba(255,123,0,0.12)",
  color: "#ffb067",
  padding: "8px 10px",
  fontSize: "12px",
  fontWeight: "900",
};

const emptyState: CSSProperties = {
  border: "1px dashed rgba(255,123,0,0.24)",
  borderRadius: "8px",
  padding: "26px",
  color: "#a7a7a7",
  textAlign: "center",
  fontWeight: "800",
  background: "rgba(255,123,0,0.06)",
};

const emptyStateBadge: CSSProperties = {
  display: "inline-flex",
  borderRadius: "8px",
  background: "rgba(255,123,0,0.12)",
  border: "1px solid rgba(255,123,0,0.22)",
  color: "#ffb067",
  padding: "7px 9px",
  fontSize: "12px",
  fontWeight: "900",
  marginBottom: "10px",
};
