import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chia Dental Clinic Platform",
    short_name: "Chia Dental",
    description: "Find and book dental appointments at the best clinics",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb", // Blue theme to match your app
    icons: [
      {
        src: "/images/chia-logo.png",
        sizes: "54x24",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/chia-logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      // Fallback square icons (you should replace these with proper square versions)
      {
        src: "/images/chia-logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/chia-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["health", "medical"],
    orientation: "portrait-primary",
    scope: "/",
    lang: "ko-KR",
  };
}
