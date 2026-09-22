import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { Header, Footer } from "@/components/site/Chrome";
import Intro from "@/components/site/Intro";
import Arik from "@/components/site/Arik";
import SmoothScroll, { RouteReset } from "@/components/site/Motion";
import { company } from "@/lib/data/company";
import { businessSchema, siteUrl } from "@/lib/seo";

const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap", variable: "--font-hanken" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MOJATECH Electrical Enterprises | Electrical, solar and security in Nigeria",
    template: "%s | MOJATECH Electrical Enterprises",
  },
  description: "MOJATECH Electrical Enterprises installs, maintains and backs up electrical, solar and security systems for homes, businesses and industry across Nigeria. Registered since 2019.",
  applicationName: company.name,
  keywords: ["MOJATECH", "Mojatech Electrical", "electrician Nigeria", "solar installation Nigeria", "inverter installation Lagos", "CCTV installation Nigeria", "electrical contractor Ogun State"],
  authors: [{ name: company.name }],
  creator: company.name,
  robots: { index: true, follow: true },
  icons: { icon: "/brand/mojatech-mark.png" },
};

export const viewport: Viewport = { themeColor: "#05081f", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className={hanken.variable}>
      <head>
        <Script id="mj-open" strategy="beforeInteractive">{`
          (function () {
            var root = document.documentElement, show = false;
            var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            try {
              var k = "mj-last-visit", last = Number(localStorage.getItem(k)) || 0, now = Date.now();
              show = now - last > 600000 && !calm && location.pathname === "/";
              localStorage.setItem(k, String(now));
            } catch (e) {}
            root.setAttribute("data-intro", show ? "on" : "off");
          })();
        `}</Script>
        <link rel="preload" as="image" href="/stock/house-off-900.webp" fetchPriority="high" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema()) }} />
      </head>
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        <Intro />
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <Arik />
        <SmoothScroll />
        <RouteReset />
      </body>
    </html>
  );
}
