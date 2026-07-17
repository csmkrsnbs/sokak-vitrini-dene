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
    "Vitrinde beğendiğin takı, kıyafet, mobilya veya otomobili yapay zekâyla anında üzerinde ya da yaşam alanında gör.",
  applicationName: "Sokak Vitrini Dene",
  category: "shopping",
  keywords: [
    "Sokak Vitrini",
    "yapay zekâ ile dene",
    "sanal deneme",
    "mobilya yerleştirme",
    "takı deneme",
    "kıyafet deneme",
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
      "Vitrinde gördüğünü yapay zekâyla üzerinde veya yaşam alanında gör.",
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
      "Vitrinde gördüğünü yapay zekâyla üzerinde veya yaşam alanında gör.",
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
