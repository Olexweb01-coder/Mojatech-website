import type { MetadataRoute } from "next";
import { company } from "@/lib/data/company";

/** Lets the site be added to a phone's home screen and opened like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: company.name,
    short_name: "MOJATECH",
    description: "Electrical, solar and security systems across Nigeria. Products, quotes and admin.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#05081f",
    lang: "en-NG",
    categories: ["business", "utilities"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Admin", url: "/admin", description: "Manage products" },
      { name: "Products", url: "/products", description: "The catalogue" },
      { name: "Get a quote", url: "/contact", description: "Send an enquiry" },
    ],
  };
}
