import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Sokak Vitrini Prova",
  description:
    "Gerçek ürün 360°, hazır manken, kendi GPU sunucunda sanal prova ve WebAR deneyimi.",
  applicationName: "Sokak Vitrini Prova",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#080705",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
