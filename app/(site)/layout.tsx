import type { Metadata, Viewport } from "next";
import "../globals.css";
import { Header, Footer } from "@/components/site/Chrome";
import Intro from "@/components/site/Intro";
import ArikLoader from "@/components/site/ArikLoader";
import SmoothScroll, { RouteReset } from "@/components/site/Motion";
import AppInstall from "@/components/site/AppInstall";
import { company } from "@/lib/data/company";
import { businessSchema, siteSchema, siteUrl, jsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    default: "Electrical, solar and security in Nigeria | MOJATECH",
    template: "%s | MOJATECH",
  },
  description: "Electrical installation, solar and inverter backup, CCTV and industrial power for homes and businesses across Nigeria. CAC registered since 2019.",
  keywords: ["MOJATECH", "Mojatech Electrical", "electrician Nigeria", "solar installation Nigeria", "inverter installation Lagos", "CCTV installation Nigeria", "electrical contractor Ogun State"],
  authors: [{ name: company.name }],
  creator: company.name,
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/brand/mojatech-mark.png", apple: "/icon-192.png" },
  appleWebApp: { capable: true, title: "MOJATECH", statusBarStyle: "black-translucent" },
  alternates: { types: { "text/plain": siteUrl + "/llms.txt" } },
};

export const viewport: Viewport = { themeColor: "#05081f", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preload" as="image" href="/stock/house-off.webp" fetchPriority="high" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(businessSchema()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(siteSchema()) }} />
      <a href="#main" className="skip-link">Skip to content</a>
      <Intro />
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <ArikLoader />
      <SmoothScroll />
      <AppInstall />
      <RouteReset />
    </>
  );
}
