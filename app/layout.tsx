import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { Header, Footer } from "@/components/site/Chrome";
import Intro from "@/components/site/Intro";
import ArikLoader from "@/components/site/ArikLoader";
import SmoothScroll, { RouteReset } from "@/components/site/Motion";
import { company } from "@/lib/data/company";
import { businessSchema, siteUrl } from "@/lib/seo";

const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap", variable: "--font-hanken" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Electrical, solar and security in Nigeria | MOJATECH",
    template: "%s | MOJATECH",
  },
  description: "Electrical installation, solar and inverter backup, CCTV and industrial power for homes and businesses across Nigeria. CAC registered since 2019.",
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
            var root = document.documentElement;
            if (root.hasAttribute("data-intro")) return;   /* decide once, never twice */
            var show = false;
            var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            try {
              var seen = sessionStorage.getItem("mj-intro-shown") === "1";
              var k = "mj-last-visit", last = Number(localStorage.getItem(k)) || 0, now = Date.now();
              show = !seen && !calm && location.pathname === "/" && now - last > 600000;
              localStorage.setItem(k, String(now));
              if (show) sessionStorage.setItem("mj-intro-shown", "1");
            } catch (e) {}
            root.setAttribute("data-intro", show ? "on" : "off");
          })();
        `}</Script>
        <link rel="preload" as="image" href="/stock/house-off.webp" fetchPriority="high" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema()) }} />
      </head>
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        <Intro />
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <ArikLoader />
        <SmoothScroll />
        <RouteReset />
      </body>
    </html>
  );
}
