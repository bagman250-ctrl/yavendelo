import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/api/",
        "/boost",
        "/boost/",
        "/chat",
        "/chat/",
        "/editar",
        "/editar/",
        "/favoritos",
        "/login",
        "/mensajes",
        "/notificaciones",
        "/perfil",
        "/register",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
