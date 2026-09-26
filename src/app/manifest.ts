import type { MetadataRoute } from "next";
import { APP_TITLE } from "@/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_TITLE,
    short_name: APP_TITLE,
    description: "答えなきゃ、ひっくり返せない。",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#12151C",
    theme_color: "#12151C",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
