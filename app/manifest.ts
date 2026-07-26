import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MyPMOS — your PMOS companion",
    short_name: "MyPMOS",
    description:
      "Track everything, spot your patterns, and walk into your doctor's visit ready. A smart companion for PMOS (formerly PCOS) and your cycle.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFF5F9",
    theme_color: "#FF6FA5",
    categories: ["health", "lifestyle", "medical"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
