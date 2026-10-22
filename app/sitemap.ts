import type { MetadataRoute } from "next";
import { services } from "@/lib/data/services";
import { listProducts } from "@/lib/store";
import { listProjects, hasPage } from "@/lib/work";
import { siteUrl } from "@/lib/seo";

/** Plain dates and a trailing slash on the home page: the format every search engine accepts. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, projects] = await Promise.all([listProducts(), listProjects()]);
  const day = new Date().toISOString().slice(0, 10);
  const pages = ["/", "/about", "/services", "/products", "/work", "/careers", "/contact", "/review"];
  return [
    ...pages.map((p) => ({
      url: siteUrl + p,
      lastModified: day,
      changeFrequency: "monthly" as const,
      priority: p === "/" ? 1 : 0.8,
    })),
    ...services.map((s) => ({
      url: siteUrl + "/services/" + s.id,
      lastModified: day,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: siteUrl + "/products/" + p.slug,
      lastModified: day,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...projects.filter(hasPage).map((p) => ({
      url: siteUrl + "/work/" + p.slug,
      lastModified: day,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
