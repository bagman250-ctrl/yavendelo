import { MetadataRoute } from "next";

const publicRoutes = [
  { path: "", priority: 1, changeFrequency: "daily" as const },
  { path: "/publicar", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/contacto", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/privacy", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/categoria/Tecnolog%C3%ADa", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/categoria/Celulares", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/categoria/Computadoras", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/categoria/Gaming", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/categoria/Autos", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/categoria/Hogar", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/categoria/Servicios", priority: 0.7, changeFrequency: "weekly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
