import type { Metadata, Viewport } from "next";

import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Sokak Vitrini Dene | Sokakta Gör, Kendinde Dene",
    template: "%s | Sokak Vitrini Dene",
  },
  description:
    "Giyim, iç giyim, takı, ayakkabı, çanta ve aksesuarları dijital profilinde dene; ürün fotoğrafından işletme için model görseli üret.",
  applicationName: "Sokak Vitrini Dene",
  category: "shopping",
  keywords: [
    "Sokak Vitrini",
    "yapay zekâ ile dene",
    "sanal giyim deneme",
    "dijital profil",
    "takı deneme",
    "üründen model görseli",
    "işletme görsel stüdyosu",
  ],
  authors: [{ name: "Sokak Vitrini" }],
  creator: "Sokak Vitrini",
  publisher: "Sokak Vitrini",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "/",
    siteName: "Sokak Vitrini Dene",
    title: "Sokakta Gör. Kendinde Dene.",
    description:
      "Ürünleri dijital profilinde dene veya tek ürün fotoğrafından model görseli oluştur.",
    images: [
      {
        url: "/concept-poster.png",
        width: 1003,
        height: 1568,
        alt: "Sokak Vitrini - Sokakta Gör, Kendinde Dene",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sokakta Gör. Kendinde Dene.",
    description:
      "Ürünleri dijital profilinde dene veya tek ürün fotoğrafından model görseli oluştur.",
    images: ["/concept-poster.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#090909",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
