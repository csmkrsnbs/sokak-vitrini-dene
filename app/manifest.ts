import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sokak Vitrini Dene",
    short_name: "SV Dene",
    description: "Vitrinde gördüğünü, hayatında gör.",
    start_url: "/",
    display: "standalone",
    background_color: "#090909",
    theme_color: "#090909",
    lang: "tr",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
