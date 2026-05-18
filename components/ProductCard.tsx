"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { addDoc, collection, deleteDoc, doc, getDocs, increment, query, serverTimestamp, updateDoc, where } from "firebase/firestore";

import { auth, db } from "../app/firebase/config";

type Product = {
  id: string;
  titulo?: string;
  precio?: number | string;
  imagen?: string;
  imagenes?: string[];
  ciudad?: string;
  categoria?: string;
  likes?: number;
};

function formatPrice(value?: number | string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function ProductCard({ product }: { product: Product }) {
  const [loaded, setLoaded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [favoriteId, setFavoriteId] = useState("");
  const [favoritesCount, setFavoritesCount] = useState(Number(product.likes || 0));

  useEffect(() => {
    async function loadFavorites() {
      try {
        setFavoritesCount(Number(product.likes || 0));

        if (!auth.currentUser) return;

        const userQuery = query(
          collection(db, "favorites"),
          where("productId", "==", product.id),
          where("userId", "==", auth.currentUser.uid)
        );
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
          setLiked(true);
          setFavoriteId(userSnapshot.docs[0].id);
        }
      } catch (error) {
        console.error("Error cargando favoritos:", error);
      }
    }

    loadFavorites();
  }, [product.id, product.likes]);

  async function toggleFavorite(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!auth.currentUser) {
      toast.error("Debes iniciar sesion");
      return;
    }

    try {
      if (liked && favoriteId) {
        await deleteDoc(doc(db, "favorites", favoriteId));
        await updateDoc(doc(db, "posts", product.id), {
          likes: increment(-1),
        });
        setLiked(false);
        setFavoritesCount((prev) => Math.max(0, prev - 1));
        return;
      }

      const docRef = await addDoc(collection(db, "favorites"), {
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

      setFavoriteId(docRef.id);
      await updateDoc(doc(db, "posts", product.id), {
        likes: increment(1),
      });
      setLiked(true);
      setFavoritesCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error actualizando favorito:", error);
    }
  }

  const image = product.imagen || product.imagenes?.[0] || "/og-image.png";

  return (
    <Link href={`/producto/${product.id}`} style={cardLink}>
      <article style={card}>
        <div style={media}>
          {!loaded && <div style={imageSkeleton} />}

          <img
            src={image}
            alt={product.titulo || "Producto en venta"}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            style={{ ...imageStyle, opacity: loaded ? 1 : 0 }}
          />

          <button
            type="button"
            onClick={toggleFavorite}
            style={{ ...favoriteButton, background: liked ? "#ff3b30" : "rgba(0,0,0,0.62)" }}
            aria-label={liked ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            {liked ? "♥" : "♡"}
          </button>

          <div style={categoryBadge}>{product.categoria || "Producto"}</div>
        </div>

        <div style={content}>
          <h2 style={title}>{product.titulo || "Producto disponible"}</h2>
          <p style={price}>{formatPrice(product.precio)}</p>

          <div style={footer}>
            <p style={city}>{product.ciudad || "México"}</p>
            <span style={favoriteCount}>♥ {favoritesCount}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

const cardLink: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
};

const card: React.CSSProperties = {
  overflow: "hidden",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
};

const media: React.CSSProperties = {
  position: "relative",
  height: "260px",
  overflow: "hidden",
  background: "#141414",
};

const imageSkeleton: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.1), rgba(255,255,255,0.04))",
};

const imageStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  transition: "opacity 0.25s ease",
};

const favoriteButton: React.CSSProperties = {
  position: "absolute",
  top: "12px",
  right: "12px",
  width: "44px",
  height: "44px",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "8px",
  color: "white",
  cursor: "pointer",
  fontSize: "22px",
  fontWeight: "900",
};

const categoryBadge: React.CSSProperties = {
  position: "absolute",
  top: "12px",
  left: "12px",
  borderRadius: "8px",
  background: "rgba(0,0,0,0.62)",
  border: "1px solid rgba(255,255,255,0.12)",
  padding: "8px 10px",
  fontSize: "12px",
  fontWeight: "900",
};

const content: React.CSSProperties = {
  padding: "20px",
};

const title: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: "22px",
  lineHeight: 1.2,
  fontWeight: "900",
};

const price: React.CSSProperties = {
  margin: "0 0 18px",
  color: "#ffb067",
  fontSize: "28px",
  fontWeight: "900",
};

const footer: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
};

const city: React.CSSProperties = {
  margin: 0,
  color: "#a7a7a7",
  fontSize: "14px",
  fontWeight: "800",
};

const favoriteCount: React.CSSProperties = {
  color: "#ffb067",
  fontWeight: "900",
};
