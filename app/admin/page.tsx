"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { User, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

import { auth, db, storage } from "@/app/firebase/config";
import BottomNav from "@/components/BottomNav";
import DeletePostDialog from "@/components/DeletePostDialog";
import TopBar from "@/components/TopBar";
import { isAdminEmail } from "@/lib/admin";
import { deletePostWithCleanup } from "@/lib/deletePost";

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
  titulo?: string;
  precio?: number | string;
  ciudad?: string;
  categoria?: string;
  imagen?: string;
  imagenes?: string[];
  userId?: string;
  userEmail?: string;
  userName?: string;
  featured?: boolean;
  featuredUntil?: TimeLike;
  createdAt?: TimeLike;
  views?: number;
  likes?: number;
  status?: string;
};

type Report = {
  id: string;
  productId?: string;
  productTitle?: string;
  titulo?: string;
  reason?: string;
  description?: string;
  status?: string;
  reportedBy?: string;
  createdAt?: TimeLike;
};

type AppUser = {
  id: string;
  email?: string;
  displayName?: string;
  name?: string;
  createdAt?: TimeLike;
};

type SupportMessage = {
  id: string;
  name?: string;
  email?: string;
  reason?: string;
  message?: string;
  page?: string;
  priority?: string;
  status?: string;
  createdAt?: TimeLike;
};

type BetaFeedback = {
  id: string;
  name?: string;
  email?: string;
  description?: string;
  message?: string;
  page?: string;
  priority?: string;
  status?: "pending" | "reviewed" | "resolved" | "closed" | string;
  source?: string;
  userId?: string | null;
  createdAt?: TimeLike;
};

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

function getMillis(value: TimeLike) {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  return value.toMillis();
}

function isPremiumActive(post: Post) {
  return post.featured === true && getMillis(post.featuredUntil) > Date.now();
}

function getDaysLeft(featuredUntil?: TimeLike) {
  const diff = getMillis(featuredUntil) - Date.now();
  return diff > 0 ? Math.ceil(diff / 86400000) : 0;
}

function formatPrice(value?: number | string) {
  return currency.format(Number(value || 0));
}

function formatAdminDate(value?: TimeLike) {
  const millis = getMillis(value);
  if (!millis) return "Sin fecha";

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(millis));
}

function getFeedbackStatusLabel(status?: string) {
  if (status === "reviewed") return "Revisado";
  if (status === "resolved" || status === "closed") return "Resuelto";
  return "Pendiente";
}

function getFeedbackStatusStyle(status?: string) {
  if (status === "resolved" || status === "closed") return successBadge;
  if (status === "reviewed") return reviewedBadge;
  return warningBadge;
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [betaFeedback, setBetaFeedback] = useState<BetaFeedback[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [deletingPost, setDeletingPost] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (isAdminEmail(currentUser?.email)) {
        await loadData();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const postsQuery = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc")
      );

      const [postsResult, usersResult, reportsResult, supportResult, betaFeedbackResult] = await Promise.allSettled([
        getDocs(postsQuery),
        getDocs(collection(db, "users")),
        getDocs(collection(db, "reports")),
        getDocs(collection(db, "supportMessages")),
        getDocs(collection(db, "betaFeedback")),
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
        setUsers(
          usersResult.value.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          })) as AppUser[]
        );
      }

      if (reportsResult.status === "fulfilled") {
        setReports(
          reportsResult.value.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          })) as Report[]
        );
      }

      if (supportResult.status === "fulfilled") {
        setSupportMessages(
          supportResult.value.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          })) as SupportMessage[]
        );
      }

      if (betaFeedbackResult.status === "fulfilled") {
        setBetaFeedback(
          betaFeedbackResult.value.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          })) as BetaFeedback[]
        );
      }
    } catch (error) {
      console.error("Error cargando panel admin:", error);
      toast.error("Error cargando panel");
    } finally {
      setLoading(false);
    }
  }

  async function toggleFeatured(postId: string, currentValue: boolean) {
    try {
      const now = Date.now();
      const featuredUntil = !currentValue ? now + 7 * 86400000 : null;

      await updateDoc(doc(db, "posts", postId), {
        featured: !currentValue,
        featuredUntil,
        boostPlan: !currentValue ? "admin_7days" : null,
        boostPaid: !currentValue,
        boostedAt: !currentValue ? now : null,
      });

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                featured: !currentValue,
                featuredUntil,
              }
            : post
        )
      );

      toast.success(!currentValue ? "Producto destacado" : "Destacado eliminado");
    } catch (error) {
      console.error("Error actualizando destacado:", error);
      toast.error("No se pudo actualizar");
    }
  }

  async function deletePost() {
    if (!postToDelete) return;
    try {
      setDeletingPost(true);
      await deletePostWithCleanup({
        db,
        storage,
        post: postToDelete,
      });

      setPosts((prev) => prev.filter((post) => post.id !== postToDelete.id));
      setPostToDelete(null);
      toast.success("Publicación eliminada");
    } catch (error) {
      console.error("Error eliminando publicación:", error);
      toast.error("No se pudo eliminar");
    } finally {
      setDeletingPost(false);
    }
  }

  async function setPostVisibility(postId: string, nextStatus: "active" | "hidden") {
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

      toast.success(nextStatus === "hidden" ? "Producto ocultado" : "Producto reactivado");
    } catch (error) {
      console.error("Error actualizando visibilidad:", error);
      toast.error("No se pudo actualizar la visibilidad");
    }
  }

  async function markReportResolved(reportId: string) {
    try {
      const resolvedAt = Date.now();

      await updateDoc(doc(db, "reports", reportId), {
        status: "resolved",
        resolvedAt,
      });

      setReports((prev) =>
        prev.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status: "resolved",
              }
            : report
        )
      );

      toast.success("Reporte resuelto");
    } catch (error) {
      console.error("Error actualizando reporte:", error);
      toast.error("No se pudo actualizar reporte");
    }
  }

  async function markSupportClosed(messageId: string) {
    try {
      await updateDoc(doc(db, "supportMessages", messageId), {
        status: "closed",
        closedAt: Date.now(),
      });

      setSupportMessages((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? {
                ...message,
                status: "closed",
              }
            : message
        )
      );

      toast.success("Mensaje cerrado");
    } catch (error) {
      console.error("Error cerrando mensaje:", error);
      toast.error("No se pudo cerrar el mensaje");
    }
  }

  async function updateBetaFeedbackStatus(feedbackId: string, status: "reviewed" | "resolved") {
    try {
      await updateDoc(doc(db, "betaFeedback", feedbackId), {
        status,
        updatedAt: Date.now(),
        ...(status === "reviewed" ? { reviewedAt: Date.now() } : { resolvedAt: Date.now() }),
      });

      setBetaFeedback((prev) =>
        prev.map((feedback) =>
          feedback.id === feedbackId
            ? {
                ...feedback,
                status,
              }
            : feedback
        )
      );

      toast.success(status === "reviewed" ? "Feedback marcado como revisado" : "Feedback resuelto");
    } catch (error) {
      console.error("Error actualizando feedback beta:", error);
      toast.error("No se pudo actualizar el feedback");
    }
  }

  const isAdmin = isAdminEmail(user?.email);

  const pendingReports = reports.filter((report) => report.status !== "resolved");
  const resolvedReports = reports.filter((report) => report.status === "resolved");
  const openSupport = supportMessages.filter((message) => message.status !== "closed");
  const unresolvedBetaFeedback = betaFeedback.filter(
    (feedback) => feedback.status !== "resolved" && feedback.status !== "closed"
  );
  const premiumPosts = posts.filter(isPremiumActive);
  const totalViews = posts.reduce((sum, post) => sum + Number(post.views || 0), 0);
  const totalLikes = posts.reduce((sum, post) => sum + Number(post.likes || 0), 0);

  const filteredPosts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesSearch =
        !term ||
        [post.titulo, post.categoria, post.ciudad, post.userEmail]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "premium" && isPremiumActive(post)) ||
        (statusFilter === "standard" && !isPremiumActive(post));

      return matchesSearch && matchesStatus;
    });
  }, [posts, search, statusFilter]);

  const recentUsers = [...users]
    .sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt))
    .slice(0, 6);

  if (authLoading || loading) {
    return (
      <main style={loadingPage}>
        <span style={loadingBox}>Cargando panel admin...</span>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <TopBar />
        <main style={blockedPage}>
          <section style={blockedCard}>
            <span style={eyebrow}>Admin</span>
            <h1 style={blockedTitle}>Acceso restringido</h1>
            <p style={mutedText}>No tienes permisos para entrar al panel.</p>
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

  return (
    <>
      <TopBar />

      <main className="fade-in" style={pageStyle}>
        <section style={containerStyle}>
          <section style={heroSection}>
            <div>
              <span style={eyebrow}>Operaciones</span>
              <h1 style={heroTitle}>Panel administrativo</h1>
              <p style={heroText}>
                Control de publicaciones, reportes, usuarios y productos premium.
              </p>
            </div>

            <div style={heroActions}>
              <Link href="/admin/analytics" style={{ textDecoration: "none" }}>
                <button type="button" style={secondaryButton}>
                  Ver analytics
                </button>
              </Link>
              <button type="button" onClick={loadData} style={primaryButton}>
                Actualizar datos
              </button>
            </div>
          </section>

          <section style={statsGrid} aria-label="Metricas principales">
            <MetricCard label="Publicaciones" value={posts.length} detail={`${filteredPosts.length} visibles`} />
            <MetricCard label="Premium activos" value={premiumPosts.length} detail="Con boost vigente" />
            <MetricCard label="Usuarios" value={users.length} detail="Registros cargados" />
            <MetricCard label="Reportes pendientes" value={pendingReports.length} detail={`${resolvedReports.length} resueltos`} />
            <MetricCard label="Soporte abierto" value={openSupport.length} detail={`${supportMessages.length} mensajes`} />
            <MetricCard label="Feedback beta" value={unresolvedBetaFeedback.length} detail={`${betaFeedback.length} reportes`} />
            <MetricCard label="Vistas" value={totalViews} detail={`${totalLikes} guardados/likes`} />
          </section>

          <section style={panelStyle}>
            <div style={sectionHeader}>
              <div>
                <h2 style={sectionTitle}>Publicaciones</h2>
                <p style={sectionSubtitle}>
                  Modera inventario, elimina contenido y activa premium por 7 dias.
                </p>
              </div>

              <div style={controls}>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar"
                  style={searchInput}
                />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  style={selectInput}
                >
                  <option value="all">Todas</option>
                  <option value="premium">Premium</option>
                  <option value="standard">Sin premium</option>
                </select>
              </div>
            </div>

            {filteredPosts.length === 0 ? (
              <EmptyState text="No hay publicaciones con esos filtros." />
            ) : (
              <div style={postsGrid}>
                {filteredPosts.map((post) => (
                  <AdminPostCard
                    key={post.id}
                    post={post}
                    onToggle={toggleFeatured}
                    onVisibilityChange={setPostVisibility}
                    onDelete={setPostToDelete}
                  />
                ))}
              </div>
            )}
          </section>

          <section style={panelStyle}>
            <div style={sectionHeader}>
              <div>
                <h2 style={sectionTitle}>Feedback beta</h2>
                <p style={sectionSubtitle}>Reportes enviados por testers desde la beta cerrada.</p>
              </div>
              <span style={smallBadge}>{unresolvedBetaFeedback.length} pendientes</span>
            </div>

            {betaFeedback.length === 0 ? (
              <EmptyState text="Aún no hay feedback beta." />
            ) : (
              <div style={listStack}>
                {[...betaFeedback]
                  .sort((a, b) => {
                    const statusWeight = (status?: string) => (status === "resolved" || status === "closed" ? 1 : 0);
                    return statusWeight(a.status) - statusWeight(b.status) || getMillis(b.createdAt) - getMillis(a.createdAt);
                  })
                  .map((feedback) => (
                  <article key={feedback.id} style={betaFeedbackCard}>
                    <div>
                      <div style={feedbackTopLine}>
                        <strong style={reportTitle}>{feedback.priority || "Media"}</strong>
                        <span style={getFeedbackStatusStyle(feedback.status)}>{getFeedbackStatusLabel(feedback.status)}</span>
                      </div>
                      <p style={reportMeta}>{feedback.page || "Sin página"}</p>
                      <p style={reportMeta}>
                        {feedback.name || "Tester"} · {feedback.email || "Sin correo"}
                      </p>
                      <p style={reportText}>{feedback.description || feedback.message || "Sin descripción"}</p>
                      <p style={dateText}>{formatAdminDate(feedback.createdAt)}</p>
                    </div>

                    {feedback.status !== "resolved" && feedback.status !== "closed" && (
                      <div style={rowActions}>
                        {feedback.status !== "reviewed" && (
                          <button
                            type="button"
                            onClick={() => updateBetaFeedbackStatus(feedback.id, "reviewed")}
                            style={secondaryButton}
                          >
                            Marcar revisado
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => updateBetaFeedbackStatus(feedback.id, "resolved")}
                          style={resolveButton}
                        >
                          Resolver
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section style={columnsGrid}>
            <section style={panelStyle}>
              <div style={sectionHeader}>
                <div>
                  <h2 style={sectionTitle}>Soporte</h2>
                  <p style={sectionSubtitle}>Mensajes enviados desde contacto.</p>
                </div>
                <span style={smallBadge}>{openSupport.length} abiertos</span>
              </div>

              {supportMessages.length === 0 ? (
                <EmptyState text="No hay mensajes de soporte." />
              ) : (
                <div style={listStack}>
                  {[...supportMessages]
                    .sort((a, b) => Number(a.status === "closed") - Number(b.status === "closed"))
                    .map((message) => (
                      <article key={message.id} style={reportCard}>
                        <div>
                          <strong style={reportTitle}>{message.reason || "Soporte"}</strong>
                          <p style={reportMeta}>
                            {message.name || "Usuario"} · {message.email || "Sin correo"}
                          </p>
                          <p style={reportText}>{message.message || "Sin mensaje"}</p>
                          <span style={message.status === "closed" ? successBadge : warningBadge}>
                            {message.status === "closed" ? "Cerrado" : "Abierto"}
                          </span>
                        </div>

                        {message.status !== "closed" && (
                          <div style={rowActions}>
                            <button
                              type="button"
                              onClick={() => markSupportClosed(message.id)}
                              style={resolveButton}
                            >
                              Cerrar
                            </button>
                          </div>
                        )}
                      </article>
                    ))}
                </div>
              )}
            </section>

            <section style={panelStyle}>
              <div style={sectionHeader}>
                <div>
                  <h2 style={sectionTitle}>Reportes</h2>
                  <p style={sectionSubtitle}>Prioriza pendientes y cierra los revisados.</p>
                </div>
                <span style={smallBadge}>{pendingReports.length} pendientes</span>
              </div>

              {reports.length === 0 ? (
                <EmptyState text="No hay reportes." />
              ) : (
                <div style={listStack}>
                  {[...reports]
                    .sort((a, b) => Number(a.status === "resolved") - Number(b.status === "resolved"))
                    .map((report) => (
                      <article key={report.id} style={reportCard}>
                        <div>
                          <strong style={reportTitle}>
                            {report.reason || report.description || "Reporte sin motivo"}
                          </strong>
                          <p style={reportMeta}>
                            {report.productTitle || report.titulo || "Producto"} ·{" "}
                            {report.reportedBy || "Usuario"}
                          </p>
                          <span style={report.status === "resolved" ? successBadge : warningBadge}>
                            {report.status === "resolved" ? "Resuelto" : "Pendiente"}
                          </span>
                        </div>

                        <div style={rowActions}>
                          {report.productId && (
                            <Link
                              href={`/producto/${report.productId}`}
                              style={{ textDecoration: "none" }}
                            >
                              <button type="button" style={secondaryButton}>
                                Ver producto
                              </button>
                            </Link>
                          )}

                          {report.status !== "resolved" && (
                            <button
                              type="button"
                              onClick={() => markReportResolved(report.id)}
                              style={resolveButton}
                            >
                              Resolver
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                </div>
              )}
            </section>

            <section style={panelStyle}>
              <div style={sectionHeader}>
                <div>
                  <h2 style={sectionTitle}>Usuarios</h2>
                  <p style={sectionSubtitle}>Ultimos registros disponibles en Firestore.</p>
                </div>
              </div>

              {recentUsers.length === 0 ? (
                <EmptyState text="No hay usuarios cargados." />
              ) : (
                <div style={listStack}>
                  {recentUsers.map((item) => (
                    <article key={item.id} style={userRow}>
                      <div style={avatar}>
                        {(item.displayName || item.name || item.email || "U").slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <strong>{item.displayName || item.name || "Usuario"}</strong>
                        <p style={reportMeta}>{item.email || item.id}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </section>
        </section>

        <DeletePostDialog
          open={Boolean(postToDelete)}
          title={postToDelete?.titulo}
          loading={deletingPost}
          onCancel={() => {
            if (!deletingPost) setPostToDelete(null);
          }}
          onConfirm={deletePost}
        />

        <BottomNav />
      </main>
    </>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <article style={metricCard}>
      <span style={metricLabel}>{label}</span>
      <strong style={metricValue}>{value.toLocaleString("es-MX")}</strong>
      <span style={metricDetail}>{detail}</span>
    </article>
  );
}

function AdminPostCard({
  post,
  onToggle,
  onVisibilityChange,
  onDelete,
}: {
  post: Post;
  onToggle: (postId: string, currentValue: boolean) => void;
  onVisibilityChange: (postId: string, nextStatus: "active" | "hidden") => void;
  onDelete: (post: Post) => void;
}) {
  const premiumActive = isPremiumActive(post);
  const image = post.imagen || post.imagenes?.[0] || "/placeholder.png";
  const isHidden = post.status === "hidden";

  return (
    <article style={postCard}>
      <Link href={`/producto/${post.id}`} style={{ textDecoration: "none" }}>
        <div style={imageWrap}>
          {premiumActive && (
            <span style={premiumBadge}>{getDaysLeft(post.featuredUntil)} dias premium</span>
          )}
          <img src={image} alt={post.titulo || "Producto"} style={postImage} />
        </div>
      </Link>

      <div style={postBody}>
        <span style={categoryBadge}>{post.categoria || "Producto"}</span>
        <h3 style={postTitle}>{post.titulo || "Producto disponible"}</h3>
        <strong style={postPrice}>{formatPrice(post.precio)}</strong>
        <p style={postMeta}>{post.ciudad || "Mexico"}</p>
        <p style={postMeta}>{post.userEmail || post.userName || "Usuario"}</p>
      </div>

      <div style={rowActions}>
        <button
          type="button"
          onClick={() => onToggle(post.id, premiumActive)}
          style={premiumActive ? activeButton : secondaryButton}
        >
          {premiumActive ? "Quitar premium" : "Destacar 7 dias"}
        </button>
        <button type="button" onClick={() => onDelete(post)} style={dangerButton}>
          Eliminar
        </button>
        <button
          type="button"
          onClick={() => onVisibilityChange(post.id, isHidden ? "active" : "hidden")}
          style={isHidden ? activeButton : warningButton}
        >
          {isHidden ? "Reactivar" : "Ocultar"}
        </button>
      </div>
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={emptyState}>
      <span style={emptyStateBadge}>Beta ops</span>
      <strong style={emptyStateTitle}>{text}</strong>
      <p style={emptyStateText}>Cuando haya actividad nueva, aparecerá aquí con acciones claras para revisarla.</p>
    </div>
  );
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
  gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
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

const panelStyle: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.1)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.028))",
  borderRadius: "8px",
  padding: "22px",
  marginBottom: "18px",
};

const sectionHeader: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const sectionTitle: CSSProperties = {
  margin: "0 0 6px",
  fontSize: "28px",
  fontWeight: "900",
};

const sectionSubtitle: CSSProperties = {
  color: "#a7a7a7",
  lineHeight: 1.6,
  margin: 0,
};

const controls: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const searchInput: CSSProperties = {
  width: "min(280px, 100%)",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.25)",
  color: "white",
  borderRadius: "8px",
  padding: "13px 14px",
  outline: "none",
};

const selectInput: CSSProperties = {
  ...searchInput,
  width: "170px",
};

const postsGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))",
  gap: "14px",
};

const postCard: CSSProperties = {
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.045)",
  borderRadius: "8px",
  boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
};

const imageWrap: CSSProperties = {
  position: "relative",
  aspectRatio: "4 / 3",
  background: "#121212",
};

const postImage: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const premiumBadge: CSSProperties = {
  position: "absolute",
  top: "10px",
  left: "10px",
  zIndex: 1,
  borderRadius: "8px",
  background: "#ff7b00",
  color: "#101010",
  padding: "7px 9px",
  fontSize: "12px",
  fontWeight: "900",
};

const postBody: CSSProperties = {
  padding: "16px",
};

const categoryBadge: CSSProperties = {
  display: "inline-flex",
  borderRadius: "8px",
  background: "rgba(255,123,0,0.12)",
  color: "#ffb067",
  padding: "7px 9px",
  fontSize: "12px",
  fontWeight: "900",
  marginBottom: "10px",
};

const postTitle: CSSProperties = {
  margin: "0 0 10px",
  color: "white",
  fontSize: "20px",
  fontWeight: "900",
  lineHeight: 1.25,
};

const postPrice: CSSProperties = {
  display: "block",
  color: "#ffb067",
  fontSize: "22px",
  marginBottom: "10px",
};

const postMeta: CSSProperties = {
  margin: "5px 0 0",
  color: "#a7a7a7",
  fontSize: "13px",
  overflowWrap: "anywhere",
};

const rowActions: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  padding: "0 16px 16px",
};

const columnsGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(360px,100%),1fr))",
  gap: "18px",
};

const listStack: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const reportCard: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  borderRadius: "8px",
  padding: "16px",
};

const betaFeedbackCard: CSSProperties = {
  ...reportCard,
  display: "grid",
  gap: "14px",
  background:
    "linear-gradient(135deg, rgba(255,123,0,0.08), transparent 42%), linear-gradient(180deg, rgba(255,255,255,0.065), rgba(255,255,255,0.035))",
};

const feedbackTopLine: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
};

const reportTitle: CSSProperties = {
  display: "block",
  fontSize: "17px",
  lineHeight: 1.4,
  marginBottom: "8px",
};

const reportMeta: CSSProperties = {
  color: "#a7a7a7",
  margin: "0 0 10px",
  overflowWrap: "anywhere",
};

const reportText: CSSProperties = {
  color: "#d4d4d4",
  lineHeight: 1.6,
  margin: "0 0 10px",
  overflowWrap: "anywhere",
};

const dateText: CSSProperties = {
  margin: "0",
  color: "#8d8d8d",
  fontSize: "12px",
  fontWeight: "800",
};

const smallBadge: CSSProperties = {
  display: "inline-flex",
  borderRadius: "8px",
  background: "rgba(255,123,0,0.12)",
  color: "#ffb067",
  padding: "9px 11px",
  fontSize: "12px",
  fontWeight: "900",
};

const warningBadge: CSSProperties = {
  ...smallBadge,
  background: "rgba(255,184,0,0.13)",
  color: "#ffd166",
};

const successBadge: CSSProperties = {
  ...smallBadge,
  background: "rgba(34,197,94,0.13)",
  color: "#86efac",
};

const reviewedBadge: CSSProperties = {
  ...smallBadge,
  background: "rgba(59,130,246,0.13)",
  color: "#93c5fd",
};

const userRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  borderRadius: "8px",
  padding: "14px",
};

const avatar: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "8px",
  background: "#ff7b00",
  color: "#101010",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "900",
  flexShrink: 0,
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

const activeButton: CSSProperties = {
  ...secondaryButton,
  border: "1px solid rgba(255,123,0,0.34)",
  background: "rgba(255,123,0,0.12)",
  color: "#ffb067",
};

const dangerButton: CSSProperties = {
  border: "none",
  cursor: "pointer",
  background: "rgba(255,59,48,0.16)",
  color: "#ff9a9a",
  padding: "13px 16px",
  borderRadius: "8px",
  fontWeight: "900",
};

const warningButton: CSSProperties = {
  border: "none",
  cursor: "pointer",
  background: "rgba(255,184,0,0.16)",
  color: "#ffd166",
  padding: "13px 16px",
  borderRadius: "8px",
  fontWeight: "900",
};

const resolveButton: CSSProperties = {
  ...primaryButton,
  background: "rgba(34,197,94,0.18)",
  color: "#86efac",
};

const emptyState: CSSProperties = {
  border: "1px dashed rgba(255,123,0,0.24)",
  borderRadius: "8px",
  padding: "26px",
  textAlign: "center",
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
  marginBottom: "12px",
};

const emptyStateTitle: CSSProperties = {
  display: "block",
  color: "white",
  fontWeight: "800",
};

const emptyStateText: CSSProperties = {
  maxWidth: "460px",
  margin: "10px auto 0",
  color: "#a7a7a7",
  lineHeight: 1.6,
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
