import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/data/company";
import { services } from "@/lib/data/services";
import { projects } from "@/lib/data/projects";
import { articles } from "@/lib/data/insights";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPages = ["", "/about", "/services", "/projects", "/insights", "/contact"].map(
    (path) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.8,
    })
  );
  const servicePages = services.map((s) => ({
    url: `${siteUrl}/services/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));
  const projectPages = projects.map((p) => ({
    url: `${siteUrl}/projects/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  const articlePages = articles.map((a) => ({
    url: `${siteUrl}/insights/${a.slug}`,
    lastModified: new Date(a.date),
    changeFrequency: "yearly" as const,
    priority: 0.7,
  }));
  return [...staticPages, ...servicePages, ...projectPages, ...articlePages];
}
