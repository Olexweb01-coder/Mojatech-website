import type { Metadata } from "next";
import { company } from "@/lib/data/company";

export const siteUrl = company.url;

/** Every page gets its own title, description and canonical address. */
export function meta({ title, description, path, image = "/stock/house-on.webp" }:
  { title: string; description: string; path: string; image?: string }): Metadata {
  const url = siteUrl + (path === "/" ? "" : path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: company.name, locale: "en_NG", type: "website", images: [{ url: image, width: 1600, height: 1066, alt: company.name }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/** Tells Google this is an electrical contractor in Nigeria, with real credentials. */
export function businessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Electrician",
    "@id": siteUrl + "/#business",
    name: company.name,
    alternateName: ["MOJATECH", "Mojatech Electrical", "Mojatech Electrical Enterprises"],
    url: siteUrl,
    telephone: company.contact.phone,
    email: company.contact.email,
    image: siteUrl + "/stock/house-on.webp",
    logo: siteUrl + "/brand/mojatech-mark.png",
    slogan: company.tagline,
    foundingDate: company.registration.date,
    description: "Electrical installation, solar and inverter systems, CCTV and security, industrial power, maintenance and power audits for homes, businesses and industry across Nigeria.",
    address: { "@type": "PostalAddress", streetAddress: company.address.street, addressRegion: company.address.region, addressCountry: company.address.country },
    areaServed: { "@type": "Country", name: company.areaServed },
    sameAs: [...company.social],
    identifier: { "@type": "PropertyValue", name: "CAC business registration", value: company.registration.number },
    knowsAbout: ["Electrical installation", "Solar power", "Inverter and battery backup", "CCTV and security systems", "Industrial electrical work", "Power audits", "Electrical automation"],
  };
}
