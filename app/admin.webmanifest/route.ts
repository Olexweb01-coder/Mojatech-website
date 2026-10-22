/* MOJATECH Admin as its own installable app, separate from the public website:
 * its own id, name, icon, start page and scope. */
export const dynamic = "force-static";

export function GET() {
  return Response.json({
    id: "/admin",
    name: "MOJATECH Admin",
    short_name: "MOJATECH",
    description: "Run MOJATECH from your phone: Arik, products, enquiries and the team.",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    display_override: ["standalone"],
    orientation: "any",
    background_color: "#05081f",
    theme_color: "#05081f",
    lang: "en-NG",
    categories: ["business", "productivity"],
    icons: [
      { src: "/admin-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/admin-icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/admin-icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/admin-icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Enquiries", url: "/admin/enquiries", icons: [{ src: "/admin-icon-192.png", sizes: "192x192" }] },
      { name: "Products", url: "/admin/products", icons: [{ src: "/admin-icon-192.png", sizes: "192x192" }] },
    ],
  }, { headers: { "Content-Type": "application/manifest+json" } });
}
