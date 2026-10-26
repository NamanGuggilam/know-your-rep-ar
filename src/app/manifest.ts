import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Know Your Rep AR",
    short_name: "Know Your Rep",
    description: "Find, understand, and contact the people who represent you in Arkansas.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f3ec",
    theme_color: "#1f5e45",
    lang: "en-US",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
