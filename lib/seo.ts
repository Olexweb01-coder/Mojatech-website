import type { Metadata } from "next";
import { company } from "@/lib/data/company";
import { services as SERVICE_LIST } from "@/lib/data/services";

export const siteUrl = company.url;

/** Turns data into a safe string for a script tag. A product named with "</script>"
 *  would otherwise close the tag and run whatever followed it. */
export function jsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** Every page gets its own title, description and canonical address. */
export function meta({ title, description, path, image = "/stock/house-on.webp" }:
  { title: string; description: string; path: string; image?: string }): Metadata {
  const url = siteUrl + path;   /* the home page keeps its trailing slash, matching the sitemap */
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
    contactPoint: [
      { "@type": "ContactPoint", contactType: "customer service", telephone: company.contact.phone, email: company.contact.email, areaServed: "NG", availableLanguage: "English" },
      { "@type": "ContactPoint", contactType: "human resources", email: company.contact.emailHr, areaServed: "NG", availableLanguage: "English" },
    ],
    hasCredential: [
      { "@type": "EducationalOccupationalCredential", credentialCategory: "Business registration",
        recognizedBy: { "@type": "Organization", name: "Corporate Affairs Commission of Nigeria" }, identifier: company.registration.number },
      { "@type": "EducationalOccupationalCredential", credentialCategory: "Electrical installation competency, Category C",
        recognizedBy: { "@type": "Organization", name: "Nigerian Electricity Management Services Agency (NEMSA)" } },
    ],
    makesOffer: SERVICE_LIST.map((s) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s.name, description: s.sub, url: siteUrl + "/services/" + s.id },
      areaServed: { "@type": "Country", name: company.areaServed },
    })),
  };
}

/** Marks the site itself, so assistants can name the publisher of every page. */
export function siteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": siteUrl + "/#website",
    url: siteUrl,
    name: company.name,
    inLanguage: "en-NG",
    publisher: { "@id": siteUrl + "/#business" },
    about: { "@id": siteUrl + "/#business" },
  };
}
