"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";

import { db } from "./firebase/config";
import BottomNav from "../components/BottomNav";
import FeaturedProducts from "@/components/FeaturedProducts";
import TopBar from "../components/TopBar";
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
  createdAt?: { seconds?: number } | number | string;
};

const categories = [
  "Tecnología",
  "Celulares",
  "Computadoras",
  "Gaming",
  "Autos",
  "Motos",
  "Moda",
  "Hogar",
  "Deportes",
  "Música",
  "Mascotas",
  "Servicios",
  "Otros",
];

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

const quickCategories = ["Tecnología", "Gaming", "Autos", "Moda", "Hogar", "Servicios"];

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

export default function Home() {
  const [posts, setPosts] = useState<ProductPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    async function getPosts() {
      try {
        const querySnapshot = await getDocs(collection(db, "posts"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ProductPost[];

        setPosts(data);
      } catch (error) {
        console.error("Error cargando productos:", error);
      } finally {
        setLoading(false);
      }
    }

    getPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => (post.status || "active") === "active")
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
  }, [posts, search, selectedCategory, selectedCity, sortBy, minPrice, maxPrice]);

  const activePosts = posts.filter((post) => (post.status || "active") === "active");
  const premiumCount = activePosts.filter((post) => isPremiumActive(post)).length;
  const cityCount = new Set(activePosts.map((post) => post.ciudad).filter(Boolean)).size;
  const hasActiveFilters =
    search || selectedCategory || selectedCity || minPrice || maxPrice || sortBy !== "recent";

  function clearFilters() {
    setSearch("");
    setSelectedCategory("");
    setSelectedCity("");
    setSortBy("recent");
    setMinPrice("");
    setMaxPrice("");
  }

  return (
    <>
      <TopBar />

      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>Marketplace local en México</p>
            <h1>Compra y vende cerca de ti con confianza.</h1>
            <p className={styles.heroCopy}>
              YaVendelo reúne publicaciones verificables, filtros útiles y contacto directo
              para que encuentres ofertas reales o vendas más rápido desde tu ciudad.
            </p>

            <div className={styles.heroActions}>
              <Link href="/publicar" className={styles.primaryButton}>
                Publicar producto
              </Link>
              <a href="#productos" className={styles.secondaryButton}>
                Explorar ofertas
              </a>
            </div>

            <div className={styles.trustGrid} aria-label="Beneficios de YaVendelo">
              <span>Publicación en minutos</span>
              <span>Chat directo</span>
              <span>Productos destacados</span>
            </div>
          </div>

          <div className={styles.heroPanel} aria-label="Resumen de marketplace">
            <div className={styles.heroImage}>
              <img
                src="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=1200&auto=format&fit=crop"
                alt="Persona comprando en un marketplace desde su teléfono"
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

        <section className={styles.searchSection} id="productos">
          <div className={styles.searchHeader}>
            <div>
              <p className={styles.sectionLabel}>Encuentra lo que necesitas</p>
              <h2>Productos publicados recientemente</h2>
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
              placeholder="Buscar iPhone, sala, moto, consola..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Buscar productos"
            />
            <Link href="/publicar" className={styles.compactPublishButton}>
              Vender ahora
            </Link>
          </div>

          <div className={styles.quickFilters} aria-label="Categorías rápidas">
            {quickCategories.map((category) => (
              <button
                key={category}
                type="button"
                className={selectedCategory === category ? styles.activeChip : styles.chip}
                onClick={() => setSelectedCategory(selectedCategory === category ? "" : category)}
              >
                {category}
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
              {categories.map((category) => (
                <option key={category}>{category}</option>
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

        <FeaturedProducts />

        <section className={styles.marketSection}>
          {loading && <ProductsSkeleton />}

          {!loading && filteredPosts.length === 0 && (
            <div className={styles.emptyState}>
              <span>Sin resultados</span>
              <h2>No encontramos productos con esos filtros</h2>
              <p>Prueba con otra búsqueda, amplía el rango de precio o explora todas las categorías.</p>
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
                  <Link key={post.id} href={`/producto/${post.id}`} className={styles.productCard}>
                    <div className={styles.productMedia}>
                      {premiumActive && <span className={styles.premiumBadge}>Premium</span>}
                      <img src={getProductImage(post)} alt={post.titulo || "Producto en venta"} loading="lazy" />
                      <span className={styles.categoryPill}>{post.categoria || "Producto"}</span>
                    </div>

                    <div className={styles.productBody}>
                      <div>
                        <h3>{post.titulo || "Producto disponible"}</h3>
                        <p>
                          {post.descripcion
                            ? `${post.descripcion.slice(0, 110)}${post.descripcion.length > 110 ? "..." : ""}`
                            : "Producto disponible en YaVendelo."}
                        </p>
                      </div>

                      <div className={styles.productFooter}>
                        <strong>{formatPrice(post.precio)}</strong>
                        <span>{post.ciudad || "México"}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className={styles.infoBand}>
          <div>
            <span className={styles.sectionLabel}>Vende mejor</span>
            <h2>Todo listo para lanzar: publicar, destacar y conversar.</h2>
          </div>

          <div className={styles.infoGrid}>
            <article>
              <strong>1</strong>
              <h3>Publica con buenas fotos</h3>
              <p>Agrega precio, ubicación y descripción clara para generar confianza desde el primer vistazo.</p>
            </article>
            <article>
              <strong>2</strong>
              <h3>Destaca tu producto</h3>
              <p>Las publicaciones premium aparecen primero y tienen mayor visibilidad en la portada.</p>
            </article>
            <article>
              <strong>3</strong>
              <h3>Cierra por chat</h3>
              <p>Habla directo con compradores interesados y acuerda los detalles de forma ágil.</p>
            </article>
          </div>
        </section>

        <section className={styles.finalCta}>
          <div>
            <p className={styles.sectionLabel}>Empieza hoy</p>
            <h2>Convierte lo que ya no usas en una venta real.</h2>
          </div>
          <Link href="/publicar" className={styles.primaryButton}>
            Publicar gratis
          </Link>
        </section>

        <footer className={styles.footer}>
          <span>YaVendelo</span>
          <div>
            <Link href="/terms">Términos</Link>
            <Link href="/privacy">Privacidad</Link>
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
