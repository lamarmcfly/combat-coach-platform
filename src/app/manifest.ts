import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Corner - Combat Sports Coaching",
    short_name: "Corner",
    description: "Train with verified combat coaches across Muay Thai, boxing, MMA, wrestling, and more.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0c",
    theme_color: "#f0473a",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
