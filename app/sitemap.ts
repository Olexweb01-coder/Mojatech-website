import type { MetadataRoute } from "next";
import { services } from "@/lib/data/services";
import { siteUrl } from "@/lib/seo";

/** Plain dates and a trailing slash on the home page: the format every search engine accepts. */
export default function sitemap(): MetadataRoute.Sitemap {
  const day = new Date().toISOString().slice(0, 10);
  const pages = ["/", "/about", "/services", "/work", "/careers", "/contact"];
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
  ];
}
