import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sokak Vitrini Dijital Beden",
    short_name: "SV Beden",
    description: "Ölçü tabanlı dijital vücut profili, beden uyumu ve kombin önizlemesi.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f1e9",
    theme_color: "#f5f1e9",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
