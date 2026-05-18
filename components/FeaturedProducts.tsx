"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { collection, getDocs, limit, query } from "firebase/firestore";

import { db } from "@/app/firebase/config";

interface Producto {
  id: string;
  titulo?: string;
  descripcion?: string;
  precio?: number | string;
  imagen?: string;
  imagenes?: string[];
  ciudad?: string;
  categoria?: string;
  featured?: boolean;
  featuredUntil?: number;
  status?: string;
}

function isPremiumActive(producto: Producto) {
  return producto.featured === true && Number(producto.featuredUntil || 0) > Date.now();
}

function getDaysLeft(featuredUntil?: number) {
  if (!featuredUntil) return 0;

  const diff = featuredUntil - Date.now();
  if (diff <= 0) return 0;

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatPrice(value?: number | string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function FeaturedProducts() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function obtenerProductos() {
      try {
        const q = query(collection(db, "posts"), limit(20));
        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Producto[];

        const premiumActivos = data
          .filter((producto) => (producto.status || "active") === "active")
          .filter((producto) => isPremiumActive(producto))
          .sort((a, b) => Number(b.featuredUntil || 0) - Number(a.featuredUntil || 0));

        setProductos(premiumActivos.slice(0, 6));
      } catch (error) {
        console.error("Error cargando destacados:", error);
      } finally {
        setLoading(false);
      }
    }

    obtenerProductos();
  }, []);

  if (loading) {
    return (
      <section className="mx-auto mb-12 w-full max-w-[1240px]">
        <div className="mb-6 h-8 w-64 animate-pulse rounded-lg bg-white/10" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
              <div className="h-56 animate-pulse bg-white/10" />
              <div className="space-y-4 p-5">
                <div className="h-5 w-3/4 animate-pulse rounded-lg bg-white/10" />
                <div className="h-4 w-1/2 animate-pulse rounded-lg bg-white/10" />
                <div className="h-6 w-1/3 animate-pulse rounded-lg bg-orange-500/20" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (productos.length === 0) return null;

  return (
    <section className="mx-auto mb-14 w-full max-w-[1240px]">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-black uppercase text-orange-300">Visibilidad extra</p>
          <h2 className="text-3xl font-black text-white md:text-4xl">Productos Premium</h2>
          <p className="mt-2 text-sm text-white/60">
            Publicaciones destacadas activas por tiempo limitado.
          </p>
        </div>

        <Link
          href="/publicar"
          className="rounded-lg border border-orange-500/30 bg-orange-500/15 px-4 py-3 text-sm font-black text-orange-300"
        >
          Destacar mi producto
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {productos.map((producto) => {
          const image = producto.imagen || producto.imagenes?.[0] || "/og-image.png";
          const daysLeft = getDaysLeft(producto.featuredUntil);

          return (
            <Link
              key={producto.id}
              href={`/producto/${producto.id}`}
              className="group overflow-hidden rounded-lg border border-orange-500/20 bg-white/[0.04] shadow-2xl shadow-orange-500/10 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/40"
            >
              <div className="relative h-60 overflow-hidden">
                <Image
                  src={image}
                  alt={producto.titulo || "Producto premium"}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute left-4 top-4 rounded-lg border border-orange-500/20 bg-orange-500/20 px-3 py-1 text-xs font-black text-orange-300 backdrop-blur-xl">
                  PREMIUM
                </div>
                <div className="absolute right-4 top-4 rounded-lg border border-white/10 bg-black/45 px-3 py-1 text-xs font-bold text-white/90 backdrop-blur-xl">
                  {daysLeft} días
                </div>
                <div className="absolute bottom-4 left-4 rounded-lg border border-white/10 bg-black/45 px-3 py-1 text-xs font-bold text-white/90 backdrop-blur-xl">
                  {producto.categoria || "Producto"}
                </div>
              </div>

              <div className="p-5">
                <h3 className="line-clamp-1 text-xl font-black text-white">
                  {producto.titulo || "Producto"}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/50">
                  {producto.descripcion || "Producto disponible en YaVendelo."}
                </p>
                <p className="mt-3 text-sm font-bold text-white/50">
                  {producto.ciudad || "México"}
                </p>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="text-2xl font-black text-orange-300">
                    {formatPrice(producto.precio)}
                  </span>
                  <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/80">
                    Ver producto
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
