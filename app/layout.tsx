import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Sokak Vitrini Dijital Beden",
  description:
    "Vücut ölçülerinden dijital profil oluşturur; gerçek ürün ölçülerini karşılaştırarak beden önerisi ve kombin önizlemesi sunar.",
  applicationName: "Sokak Vitrini Dijital Beden",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Sokak Vitrini Dijital Beden",
    description: "Ölçü tabanlı beden uyumu ve kombin önizlemesi.",
    type: "website",
    locale: "tr_TR",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f1e9",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
