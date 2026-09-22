import type { MetadataRoute } from "next";
import { services } from "@/lib/data/services";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = ["", "/about", "/services", "/work", "/careers", "/contact"];
  return [
    ...pages.map((p) => ({ url: siteUrl + p, lastModified: now, changeFrequency: "monthly" as const, priority: p === "" ? 1 : 0.8 })),
    ...services.map((s) => ({ url: siteUrl + "/services/" + s.id, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
