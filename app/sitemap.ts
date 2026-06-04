import { MetadataRoute } from "next";

import { marketplaceCategories } from "@/lib/categories";

const publicRoutes = [
  { path: "", priority: 1, changeFrequency: "daily" as const },
  { path: "/publicar", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/ayuda", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/contacto", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/privacy", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.4, changeFrequency: "yearly" as const },
  ...marketplaceCategories.map((category) => ({
    path: `/categoria/${category.slug}`,
    priority: 0.7,
    changeFrequency: "weekly" as const,
  })),
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://yavendeloapp.com";

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
