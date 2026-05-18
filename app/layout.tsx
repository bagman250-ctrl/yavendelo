import type { Metadata } from "next";
import "./globals.css";

import { GoogleAnalytics } from "@next/third-parties/google";

export const metadata: Metadata = {
  title: "YaVendelo",
  description: "Marketplace moderno para comprar y vender fácilmente.",
  keywords: [
    "marketplace",
    "comprar",
    "vender",
    "productos",
    "segunda mano",
    "yavendelo",
  ],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://yavendelo.com"
  ),
  openGraph: {
    title: "YaVendelo",
    description: "Marketplace moderno para comprar y vender fácilmente.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://yavendelo.com",
    siteName: "YaVendelo",
    locale: "es_MX",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "YaVendelo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YaVendelo",
    description: "Marketplace moderno para comprar y vender fácilmente.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>

      {process.env.NEXT_PUBLIC_GA_ID ? (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      ) : null}
    </html>
  );
}