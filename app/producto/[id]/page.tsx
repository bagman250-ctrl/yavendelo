import type { Metadata } from "next";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../../firebase/config";

import ProductClient from "./ProductClient";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type Product = {
  id: string;
  titulo?: string;
  descripcion?: string;
  ciudad?: string;
  imagen?: string;
  imagenes?: string[];
};

async function getProduct(id: string) {
  try {
    const snapshot = await getDoc(
      doc(db, "posts", id)
    );

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as Product;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Producto no encontrado",
      description: "Este producto no está disponible en YaVendelo.",
    };
  }

  const title = `${product.titulo || "Producto"} en ${product.ciudad || "México"}`;
  const description =
    product.descripcion?.slice(0, 150) ||
    `Compra ${product.titulo || "este producto"} en YaVendelo.`;

  const image =
    product.imagen ||
    product.imagenes?.[0] ||
    "/og-image.png";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: product.titulo || "Producto YaVendelo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;

  return (
    <ProductClient productId={id} />
  );
}
