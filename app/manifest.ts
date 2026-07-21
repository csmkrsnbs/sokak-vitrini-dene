import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sokak Vitrini Prova",
    short_name: "SV Prova",
    description: "Gerçek 360°, hazır manken, self-hosted sanal prova ve WebAR.",
    start_url: "/",
    display: "standalone",
    background_color: "#080705",
    theme_color: "#080705",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
