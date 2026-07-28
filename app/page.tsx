"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "./firebase/config";
import BottomNav from "../components/BottomNav";
import FeaturedProducts from "@/components/FeaturedProducts";
import TopBar from "../components/TopBar";
import UserAvatar from "@/components/UserAvatar";
import { analyticsEvents, trackEvent } from "@/lib/analytics";
import { marketplaceCategories, quickMarketplaceCategories } from "@/lib/categories";
import { getNotificationActorName } from "@/lib/notificationActors";
import styles from "./page.module.css";

type ProductPost = {
  id: string;
  titulo?: string;
  descripcion?: string;
  precio?: number | string;
  imagen?: string;
  imagenes?: string[];
  ciudad?: string;
  categoria?: string;
  featured?: boolean;
  featuredUntil?: number | string;
  status?: string;
  likes?: number;
  createdAt?: { seconds?: number } | number | string;
  userName?: string;
  userId?: string;
  userEmail?: string;
  userPhotoURL?: string;
};

const cities = [
  "Ciudad de México",
  "Guadalajara",
  "Monterrey",
  "Querétaro",
  "Puebla",
  "León",
  "Tijuana",
  "Mérida",
  "Cancún",
  "Toluca",
];

function isPremiumActive(post: ProductPost) {
  return post.featured === true && Number(post.featuredUntil || 0) > Date.now();
}

function getCreatedValue(post: ProductPost) {
  if (typeof post.createdAt === "number") return post.createdAt;
  if (typeof post.createdAt === "string") return Number(post.createdAt) || 0;
  return Number(post.createdAt?.seconds || 0);
}

function formatPrice(value?: number | string) {
  const price = Number(value || 0);

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(price);
}

function getProductImage(post: ProductPost) {
  return post.imagen || post.imagenes?.[0] || "/og-image.png";
}

function isNewPost(post: ProductPost) {
  const created = getCreatedValue(post);
  if (!created) return false;

  const createdMillis = created < 10000000000 ? created * 1000 : created;
  return Date.now() - createdMillis < 7 * 86400000;
}

export default function Home() {
  const [posts, setPosts] = useState<ProductPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [statusFilter, setStatusFilter] = useState("active");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<Record<string, string>>({});
  const [favoritesCount, setFavoritesCount] = useState<Record<string, number>>({});
  const [favoriteLoading, setFavoriteLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    trackEvent(analyticsEvents.viewHome, { page: "/" });

    const initialQuery = new URLSearchParams(window.location.search).get("q");
    if (initialQuery) {
      setSearch(initialQuery);
      requestAnimationFrame(() => {
        document.getElementById("productos")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    function syncSearchFromTopBar(event: Event) {
      const query = (event as CustomEvent<string>).detail || "";
      setSearch(query);
      requestAnimationFrame(() => {
        document.getElementById("productos")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    window.addEventListener("yavendelo-search", syncSearchFromTopBar);

    async function getPosts() {
      try {
        const querySnapshot = await getDocs(collection(db, "posts"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ProductPost[];

        setPosts(data);
        setFavoritesCount(
          data.reduce<Record<string, number>>((acc, post) => {
            acc[post.id] = Number(post.likes || 0);
            return acc;
          }, {})
        );

        if (auth.currentUser) {
          const favoritesQuery = query(collection(db, "favorites"), where("userId", "==", auth.currentUser.uid));
          const favoritesSnapshot = await getDocs(favoritesQuery);
          const nextFavoriteIds = favoritesSnapshot.docs.reduce<Record<string, string>>((acc, favoriteDoc) => {
            const favorite = favoriteDoc.data() as { productId?: string };
            if (favorite.productId) acc[favorite.productId] = favoriteDoc.id;
            return acc;
          }, {});

          setFavoriteIds(nextFavoriteIds);
        }
      } catch (error) {
        console.error("Error cargando productos:", error);
      } finally {
        setLoading(false);
      }
    }

    getPosts();

    return () => window.removeEventListener("yavendelo-search", syncSearchFromTopBar);
  }, []);

  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        const searchText = search.toLowerCase().trim();
        const title = post.titulo?.toLowerCase() || "";
        const description = post.descripcion?.toLowerCase() || "";
        const category = post.categoria?.toLowerCase() || "";
        const city = post.ciudad?.toLowerCase() || "";
        const productPrice = Number(post.precio || 0);

        const matchesSearch = searchText
          ? title.includes(searchText) ||
            description.includes(searchText) ||
            category.includes(searchText) ||
            city.includes(searchText)
          : true;

        return (
          matchesSearch &&
          (selectedCategory ? post.categoria === selectedCategory : true) &&
          (selectedCity ? post.ciudad === selectedCity : true) &&
          (statusFilter === "all"
            ? !["hidden", "deleted"].includes(post.status || "active")
            : (post.status || "active") === statusFilter) &&
          (minPrice ? productPrice >= Number(minPrice) : true) &&
          (maxPrice ? productPrice <= Number(maxPrice) : true)
        );
      })
      .sort((a, b) => {
        const aPremium = isPremiumActive(a);
        const bPremium = isPremiumActive(b);

        if (aPremium && !bPremium) return -1;
        if (!aPremium && bPremium) return 1;
        if (sortBy === "price_asc") return Number(a.precio || 0) - Number(b.precio || 0);
        if (sortBy === "price_desc") return Number(b.precio || 0) - Number(a.precio || 0);

        return getCreatedValue(b) - getCreatedValue(a);
      });
  }, [posts, search, selectedCategory, selectedCity, statusFilter, sortBy, minPrice, maxPrice]);

  const activePosts = posts.filter((post) => (post.status || "active") === "active");
  const premiumCount = activePosts.filter((post) => isPremiumActive(post)).length;
  const cityCount = new Set(activePosts.map((post) => post.ciudad).filter(Boolean)).size;
  const hasActiveFilters =
    search ||
    selectedCategory ||
    selectedCity ||
    statusFilter !== "active" ||
    minPrice ||
    maxPrice ||
    sortBy !== "recent";

  function clearFilters() {
    setSearch("");
    setSelectedCategory("");
    setSelectedCity("");
    setStatusFilter("active");
    setSortBy("recent");
    setMinPrice("");
    setMaxPrice("");
    trackEvent("filters_cleared", { location: "home" });
  }

  function submitHeroSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanSearch = search.trim();

    if (cleanSearch) {
      window.history.replaceState({}, "", `/?q=${encodeURIComponent(cleanSearch)}#productos`);
      trackEvent(analyticsEvents.search, {
        search_term: cleanSearch,
        query_length: cleanSearch.length,
        location: "hero_submit",
      });
    }

    document.getElementById("productos")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function toggleFavorite(product: ProductPost) {
    if (!auth.currentUser) {
      toast.error("Inicia sesión para guardar favoritos");
      return;
    }

    if (favoriteLoading[product.id]) return;

    try {
      setFavoriteLoading((prev) => ({ ...prev, [product.id]: true }));
      const currentFavoriteId = favoriteIds[product.id];

      if (currentFavoriteId) {
        await deleteDoc(doc(db, "favorites", currentFavoriteId));
        await updateDoc(doc(db, "posts", product.id), { likes: increment(-1) });
        setFavoriteIds((prev) => {
          const next = { ...prev };
          delete next[product.id];
          return next;
        });
        setFavoritesCount((prev) => ({ ...prev, [product.id]: Math.max(0, (prev[product.id] || 0) - 1) }));
        return;
      }

      const favoriteRef = await addDoc(collection(db, "favorites"), {
        productId: product.id,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        titulo: product.titulo,
        imagen: product.imagen || product.imagenes?.[0] || "",
        precio: product.precio,
        ciudad: product.ciudad,
        categoria: product.categoria,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "posts", product.id), { likes: increment(1) });
      setFavoriteIds((prev) => ({ ...prev, [product.id]: favoriteRef.id }));
      setFavoritesCount((prev) => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 }));
      trackEvent(analyticsEvents.favoriteProduct, { product_id: product.id, category: product.categoria, location: "home_card" });

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
    } catch (error) {
      console.error("Error actualizando favorito:", error);
      toast.error("No pudimos actualizar favoritos");
    } finally {
      setFavoriteLoading((prev) => ({ ...prev, [product.id]: false }));
    }
  }

  return (
    <>
      <TopBar />

      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>Marketplace local en México</p>
            <h1>Compra y vende cerca de ti</h1>
            <p className={styles.heroCopy}>
              Publica gratis, encuentra ofertas reales y habla directo por chat.
              Todo pensado para comprar y vender con más confianza en tu ciudad.
            </p>

            <div className={styles.heroSearchCard}>
              <label htmlFor="hero-search">¿Qué quieres encontrar hoy?</label>
              <form className={styles.heroSearchRow} onSubmit={submitHeroSearch}>
                <input
                  id="hero-search"
                  type="search"
                  placeholder="Busca autos, celulares, muebles, ropa..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    if (event.target.value.trim().length >= 3) {
                      trackEvent(analyticsEvents.search, {
                        search_term: event.target.value.trim(),
                        query_length: event.target.value.trim().length,
                        location: "hero",
                      });
                    }
                  }}
                />
                <button type="submit" className={styles.primaryButton}>
                  Buscar
                </button>
              </form>
              <p>Tip seguro: no compartas códigos ni anticipos. Revisa el producto antes de pagar.</p>
            </div>

            <div className={styles.heroActions}>
              <Link
                href="/publicar"
                className={styles.primaryButton}
                onClick={() => trackEvent("publish_cta_clicked", { location: "home_hero" })}
              >
                Publicar gratis
              </Link>
              <a
                href="#productos"
                className={styles.secondaryButton}
                onClick={() => trackEvent("explore_clicked", { location: "home_hero" })}
              >
                Explorar productos
              </a>
            </div>

            <div className={styles.trustGrid} aria-label="Beneficios de YaVendelo">
              <Link href="/ayuda" className={styles.betaChip}>
                Ayuda y feedback
              </Link>
              <span>Publica gratis</span>
              <span>Chat directo</span>
              <span>Ofertas por ciudad</span>
            </div>
          </div>

          <div className={styles.heroPanel} aria-label="Resumen de marketplace">
            <div className={styles.heroImage}>
              <Image
                src="/brand/hero-city-marketplace.jpg"
                alt="Ciudad moderna con edificios y una persona usando el celular para comprar y vender cerca"
                fill
                priority
                sizes="(max-width: 1100px) 100vw, 46vw"
              />
            </div>

            <div className={styles.statRow}>
              <div>
                <strong>{loading ? "..." : activePosts.length}</strong>
                <span>Publicaciones</span>
              </div>
              <div>
                <strong>{loading ? "..." : premiumCount}</strong>
                <span>Premium</span>
              </div>
              <div>
                <strong>{loading ? "..." : cityCount || "10+"}</strong>
                <span>Ciudades</span>
              </div>
            </div>
          </div>
        </section>

        <FeaturedProducts />

        <section className={styles.confidenceBand} aria-label="Confianza y seguridad">
          <article>
            <span className={styles.confidenceIcon} aria-hidden="true">✓</span>
            <strong>Compra con calma</strong>
            <span>Pregunta por estado, entrega y forma de pago antes de cerrar.</span>
          </article>
          <article>
            <span className={styles.confidenceIcon} aria-hidden="true">↔</span>
            <strong>Chat dentro de YaVendelo</strong>
            <span>Mantén dudas y acuerdos en la conversación del producto.</span>
          </article>
          <article>
            <span className={styles.confidenceIcon} aria-hidden="true">⌂</span>
            <strong>Comunidad local</strong>
            <span>Encuentra productos y vendedores cerca de tu ciudad.</span>
          </article>
        </section>

        <section className={styles.howItWorks} aria-labelledby="como-funciona">
          <div className={styles.howHeader}>
            <p className={styles.sectionLabel}>Cómo funciona</p>
            <h2 id="como-funciona">Publica, conversa y cierra el trato</h2>
          </div>

          <div className={styles.stepsGrid}>
            <article>
              <strong>1</strong>
              <h3>Publica tu producto</h3>
              <p>Sube fotos, precio, ciudad y una descripción clara en minutos.</p>
            </article>
            <article>
              <strong>2</strong>
              <h3>Recibe mensajes</h3>
              <p>Las personas interesadas te contactan directo desde YaVendelo.</p>
            </article>
            <article>
              <strong>3</strong>
              <h3>Cierra el trato</h3>
              <p>Acuerda entrega, revisa el producto y compra o vende con calma.</p>
            </article>
          </div>
        </section>

        <section className={styles.searchSection} id="productos">
          <div className={styles.searchHeader}>
            <div>
              <p className={styles.sectionLabel}>Productos destacados</p>
              <h2>Explora publicaciones reales cerca de ti</h2>
              <p className={styles.searchSubtitle}>Filtra por categoría, ciudad, precio o estado para encontrar rápido lo que buscas.</p>
            </div>

            {!loading && (
              <p className={styles.resultCount}>
                {filteredPosts.length} resultado{filteredPosts.length === 1 ? "" : "s"}
              </p>
            )}
          </div>

          <div className={styles.searchBox}>
            <input
              type="search"
              placeholder="Busca autos, celulares, muebles, ropa..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                if (event.target.value.trim().length >= 3) {
                  trackEvent(analyticsEvents.search, {
                    search_term: event.target.value.trim(),
                    query_length: event.target.value.trim().length,
                  });
                }
              }}
              aria-label="Buscar productos"
            />
            <Link
              href="/publicar"
              className={styles.compactPublishButton}
              onClick={() => trackEvent("publish_cta_clicked", { location: "home_search" })}
            >
              Vender ahora
            </Link>
          </div>

          <div className={styles.quickFilters} aria-label="Categorías rápidas">
            {quickMarketplaceCategories.map((category) => (
              <button
                key={category.slug}
                type="button"
                className={selectedCategory === category.label ? styles.activeChip : styles.chip}
                onClick={() => {
                  const nextCategory = selectedCategory === category.label ? "" : category.label;
                  setSelectedCategory(nextCategory);
                  trackEvent(analyticsEvents.filterCategory, { category: category.label, enabled: Boolean(nextCategory) });
                }}
              >
                {category.icon} {category.label}
              </button>
            ))}
          </div>

          <div className={styles.filterGrid}>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              aria-label="Filtrar por categoría"
            >
              <option value="">Todas las categorías</option>
              {marketplaceCategories.map((category) => (
                <option key={category.slug} value={category.label}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>

            <select
              value={selectedCity}
              onChange={(event) => setSelectedCity(event.target.value)}
              aria-label="Filtrar por ciudad"
            >
              <option value="">Todas las ciudades</option>
              {cities.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filtrar por estado"
            >
              <option value="active">Solo activos</option>
              <option value="sold">Vendidos</option>
              <option value="all">Todos los estados</option>
            </select>

            <input
              type="number"
              min="0"
              placeholder="Precio mínimo"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              aria-label="Precio mínimo"
            />

            <input
              type="number"
              min="0"
              placeholder="Precio máximo"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              aria-label="Precio máximo"
            />

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label="Ordenar productos"
            >
              <option value="recent">Más recientes</option>
              <option value="price_asc">Precio menor</option>
              <option value="price_desc">Precio mayor</option>
            </select>

            {hasActiveFilters && (
              <button type="button" className={styles.clearButton} onClick={clearFilters}>
                Limpiar filtros
              </button>
            )}
          </div>
        </section>

        <section className={styles.marketSection}>
          {loading && <ProductsSkeleton />}

          {!loading && filteredPosts.length === 0 && (
            <div className={styles.emptyState}>
              <span>Sin resultados</span>
              <h2>No encontramos productos con esos filtros</h2>
              <p>Prueba con otra búsqueda, cambia la ciudad o limpia los filtros para ver más publicaciones.</p>
              <button type="button" onClick={clearFilters}>
                Ver todos los productos
              </button>
            </div>
          )}

          {!loading && filteredPosts.length > 0 && (
            <div className={styles.productsGrid}>
              {filteredPosts.map((post) => {
                const premiumActive = isPremiumActive(post);

                return (
                  <article
                    key={post.id}
                    className={styles.productCard}
                  >
                    <Link
                      href={`/producto/${post.id}`}
                      className={styles.productCardLink}
                      onClick={() =>
                        trackEvent("product_card_clicked", {
                          product_id: post.id,
                          category: post.categoria,
                          premium: premiumActive,
                          location: "home_grid",
                        })
                      }
                    >
                      <div className={styles.productMedia}>
                        <div className={styles.badgeStack}>
                          {isNewPost(post) && <span className={styles.newBadge}>Nuevo</span>}
                          {premiumActive && <span className={styles.premiumBadge}>Destacado</span>}
                          {post.status === "sold" && <span className={styles.soldBadge}>Vendido</span>}
                        </div>
                        <img
                          src={getProductImage(post)}
                          alt={post.titulo || "Producto en venta"}
                          loading="lazy"
                          decoding="async"
                        />
                        <span className={styles.categoryPill}>{post.categoria || "Producto"}</span>
                      </div>

                      <div className={styles.productBody}>
                        <div className={styles.productSummary}>
                          <div className={styles.priceLine}>
                            <strong>{formatPrice(post.precio)}</strong>
                            <span>{post.ciudad || "México"}</span>
                          </div>
                          <h3>{post.titulo || "Producto disponible"}</h3>
                          <p>
                            {post.descripcion
                              ? `${post.descripcion.slice(0, 96)}${post.descripcion.length > 96 ? "..." : ""}`
                              : "Producto disponible en YaVendelo."}
                          </p>
                        </div>

                        <div className={styles.sellerLine}>
                          <UserAvatar
                            name={post.userName}
                            email={post.userEmail}
                            photoURL={post.userPhotoURL}
                            size={30}
                            label="Vendedor"
                          />
                          <span>{post.userName || "Vendedor YaVendelo"}</span>
                        </div>

                        <div className={styles.productFooter}>
                          <span>{favoritesCount[post.id] || 0} favoritos</span>
                          <span className={styles.viewCta}>Ver detalles</span>
                        </div>
                      </div>
                    </Link>

                    <button
                      type="button"
                      className={favoriteIds[post.id] ? styles.favoriteButtonActive : styles.favoriteButton}
                      onClick={() => toggleFavorite(post)}
                      disabled={Boolean(favoriteLoading[post.id])}
                      aria-label={favoriteIds[post.id] ? "Quitar de favoritos" : "Agregar a favoritos"}
                    >
                      {favoriteIds[post.id] ? "♥" : "♡"}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className={styles.infoBand}>
          <div>
            <span className={styles.sectionLabel}>Vende mejor</span>
            <h2>Más confianza desde el primer vistazo.</h2>
          </div>

          <div className={styles.infoGrid}>
            <article>
              <strong>✓</strong>
              <h3>Publica con buenas fotos</h3>
              <p>Agrega precio, ubicación y descripción clara para generar confianza desde el primer vistazo.</p>
            </article>
            <article>
              <strong>★</strong>
              <h3>Destaca tu producto</h3>
              <p>Las publicaciones premium aparecen primero y tienen mayor visibilidad en la portada.</p>
            </article>
            <article>
              <strong>↗</strong>
              <h3>Cierra por chat</h3>
              <p>Habla directo con compradores interesados y acuerda los detalles de forma ágil.</p>
            </article>
          </div>
        </section>

        <section className={styles.betaCta}>
          <div>
            <p className={styles.sectionLabel}>Ayuda y feedback</p>
            <h2>¿Necesitas ayuda?</h2>
            <p>Cuéntanos si algo no se entiende o si necesitas reportar un problema.</p>
          </div>
          <Link href="/ayuda#feedback" className={styles.secondaryButton}>
            Reportar problema
          </Link>
        </section>

        <section className={styles.finalCta}>
          <div>
            <p className={styles.sectionLabel}>Empieza hoy</p>
            <h2>Convierte lo que ya no usas en una venta real.</h2>
            <p className={styles.finalCopy}>Úsalo desde tu navegador y publica gratis cuando estés listo.</p>
          </div>
          <Link
            href="/publicar"
            className={styles.primaryButton}
            onClick={() => trackEvent("publish_cta_clicked", { location: "home_final" })}
          >
            Publicar gratis
          </Link>
        </section>

        <footer className={styles.footer}>
          <span>YaVendelo</span>
          <div>
            <Link href="/terms">Términos</Link>
            <Link href="/privacy">Privacidad</Link>
            <Link href="/ayuda">Ayuda</Link>
            <Link href="/contacto">Contacto</Link>
          </div>
        </footer>

        <BottomNav />
      </main>
    </>
  );
}

function ProductsSkeleton() {
  return (
    <div className={styles.productsGrid}>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className={styles.skeletonCard}>
          <div className={styles.skeletonImage} />
          <div className={styles.skeletonBody}>
            <span />
            <span />
            <span />
          </div>
        </div>
      ))}
    </div>
  );
}
