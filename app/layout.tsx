import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Cursor from "@/components/Cursor";
import ScrollProgress from "@/components/ScrollProgress";
import { company, siteUrl, isProvided } from "@/lib/data/company";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default:
      "MOJATECH Electrical Enterprises | Electrical, Solar, Security & Facility Solutions in Lagos",
    template: "%s",
  },
  description: company.description,
  applicationName: company.shortName,
  keywords: [
    "MOJATECH",
    "MOJATECH Electrical Enterprises",
    "electrical engineering company in Lagos",
    "electrical services Lagos",
    "solar installation Lagos",
    "security systems Lagos",
    "facility management Lagos",
    "electrical consultant Lagos",
  ],
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0B0C12",
  width: "device-width",
  initialScale: 1,
};

function StructuredData() {
  const sameAs = Object.values(company.social).filter((v) => isProvided(v));
  const org = {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    "@id": `${siteUrl}/#organization`,
    name: company.name,
    url: siteUrl,
    logo: `${siteUrl}/logo.jpeg`,
    description: company.description,
    slogan: company.tagline,
    areaServed: { "@type": "City", name: company.location.city },
    address: {
      "@type": "PostalAddress",
      addressLocality: company.location.city,
      addressRegion: company.location.state,
      addressCountry: company.location.countryCode,
      ...(isProvided(company.contact.address)
        ? { streetAddress: company.contact.address }
        : {}),
    },
    ...(isProvided(company.contact.phone) ? { telephone: company.contact.phone } : {}),
    ...(isProvided(company.contact.email) ? { email: company.contact.email } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
  const site = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: company.name,
    publisher: { "@id": `${siteUrl}/#organization` },
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(site) }}
      />
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only z-[90] bg-brand-red px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <StructuredData />
        <ScrollProgress />
        <Cursor />
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
