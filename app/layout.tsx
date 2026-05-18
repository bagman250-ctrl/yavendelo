import type {
  Metadata,
  Viewport
} from "next";

import { Toaster } from "react-hot-toast";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000"
  ),

  title: {
    default:
      "YaVendelo | Compra y vende en tu zona",
    template:
      "%s | YaVendelo",
  },

  description:
    "YaVendelo es un marketplace para comprar, vender y descubrir productos cerca de ti en México.",

  keywords: [
    "YaVendelo",
    "marketplace México",
    "comprar productos",
    "vender productos",
    "segunda mano",
    "productos usados",
    "productos nuevos",
    "compra local",
    "venta local",
    "Querétaro",
  ],

  applicationName:
    "YaVendelo",

  authors: [
    {
      name:
        "YaVendelo",
    },
  ],

  creator:
    "YaVendelo",

  publisher:
    "YaVendelo",

  manifest:
    "/manifest.json",

  icons: {
    icon:
      "/icon-192.png",
    apple:
      "/icon-192.png",
  },

  openGraph: {
    title:
      "YaVendelo | Compra y vende en tu zona",
    description:
      "Publica productos, encuentra ofertas y conecta con compradores y vendedores cerca de ti.",
    type:
      "website",
    siteName:
      "YaVendelo",
    locale:
      "es_MX",
    images: [
      {
        url:
          "/og-image.png",
        width:
          1200,
        height:
          630,
        alt:
          "YaVendelo Marketplace",
      },
    ],
  },

  twitter: {
    card:
      "summary_large_image",
    title:
      "YaVendelo | Compra y vende en tu zona",
    description:
      "Marketplace local para comprar y vender productos en México.",
    images: [
      "/og-image.png",
    ],
  },

  robots: {
    index:
      true,
    follow:
      true,
    googleBot: {
      index:
        true,
      follow:
        true,
      "max-image-preview":
        "large",
      "max-snippet":
        -1,
      "max-video-preview":
        -1,
    },
  },

  appleWebApp: {
    capable:
      true,
    statusBarStyle:
      "black-translucent",
    title:
      "YaVendelo",
  },

  category:
    "marketplace",
};

export const viewport: Viewport = {
  themeColor:
    "#ff7b00",
  width:
    "device-width",
  initialScale:
    1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es-MX"
      data-scroll-behavior="smooth"
    >
      <body>
        {children}

        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,

            style: {
              background:
                "rgba(15,15,15,0.95)",
              color:
                "#ffffff",
              border:
                "1px solid rgba(255,255,255,0.10)",
              borderRadius:
                "18px",
              padding:
                "14px 18px",
              backdropFilter:
                "blur(18px)",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.45)",
              fontWeight:
                "800",
            },

            success: {
              iconTheme: {
                primary:
                  "#ff7b00",
                secondary:
                  "#ffffff",
              },
            },

            error: {
              iconTheme: {
                primary:
                  "#ff3b30",
                secondary:
                  "#ffffff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}