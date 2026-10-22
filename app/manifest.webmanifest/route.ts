import { company } from "@/lib/data/company";

/* The website as an installable app. The admin has its own, separate manifest
 * (/admin.webmanifest), so visitors installing the site never see an Admin entry. */
export const dynamic = "force-static";

export function GET() {
  return Response.json({
    id: "/",
    name: company.name,
    short_name: "MOJATECH",
    description: "Electrical, solar and security systems across Nigeria. Products and quotes.",
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
      { name: "Products", url: "/products", description: "The catalogue" },
      { name: "Get a quote", url: "/contact", description: "Send an enquiry" },
    ],
  }, { headers: { "Content-Type": "application/manifest+json" } });
}
