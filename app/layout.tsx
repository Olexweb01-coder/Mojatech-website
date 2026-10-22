import Script from "next/script";
import { Hanken_Grotesk } from "next/font/google";
import { company } from "@/lib/data/company";
import { siteUrl } from "@/lib/seo";
import type { Metadata } from "next";

/* The shared root: only what the website and the admin app both need.
 * Each side brings its own styles, chrome and scripts in its own layout,
 * so the admin never downloads the website's animation code, and vice versa. */

const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap", variable: "--font-hanken" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: company.name,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className={hanken.variable} suppressHydrationWarning>
      <head>
        {/* Decides, before the first paint, whether the home page plays its opening.
            It only ever plays on "/", so it is inert everywhere else, including the admin. */}
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
      </head>
      <body>{children}</body>
    </html>
  );
}
