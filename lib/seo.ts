import type { Metadata } from "next";
import { siteUrl, company } from "@/lib/data/company";

interface PageMeta {
  title: string;
  description: string;
  path: string; // e.g. "/services/solar-power"
  type?: "website" | "article";
}

/** Builds unique, canonicalised metadata (title, description, OG, Twitter). */
export function buildMetadata({ title, description, path, type = "website" }: PageMeta): Metadata {
  const url = `${siteUrl}${path === "/" ? "" : path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: company.name,
      type,
      locale: "en_NG",
      images: [{ url: `${siteUrl}/logo.jpeg`, width: 512, height: 512, alt: `${company.shortName} logo` }],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [`${siteUrl}/logo.jpeg`],
    },
  };
}
