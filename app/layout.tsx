import type { Metadata } from "next";
import "./globals.css";

import { GoogleAnalytics } from "@next/third-parties/google";
import BetaBanner from "@/components/BetaBanner";

export const metadata: Metadata = {
  title: {
    default: "YaVendelo | Marketplace local en Mexico",
    template: "%s | YaVendelo",
  },
  description:
    "Compra y vende productos cerca de ti en YaVendelo, el marketplace local en Mexico con publicaciones gratis, chat directo y vendedores reales.",
  keywords: [
    "marketplace",
    "comprar",
    "vender",
    "productos",
    "segunda mano",
    "YaVendelo",
    "marketplace Mexico",
    "comprar cerca de mi",
    "vender productos usados",
  ],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://yavendeloapp.com"
  ),
  alternates: {
    canonical: "/",
  },
  applicationName: "YaVendelo",
  appleWebApp: {
    capable: true,
    title: "YaVendelo",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "YaVendelo | Marketplace local en Mexico",
    description:
      "Compra y vende cerca de ti con publicaciones gratis, productos reales y chat directo.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://yavendeloapp.com",
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
    title: "YaVendelo | Marketplace local en Mexico",
    description: "Compra y vende productos cerca de ti con publicaciones gratis y chat directo.",
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
        <BetaBanner />
        {children}
      </body>

      {process.env.NEXT_PUBLIC_GA_ID ? (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      ) : null}
    </html>
  );
}
