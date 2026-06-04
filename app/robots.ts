import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://yavendeloapp.com";

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
