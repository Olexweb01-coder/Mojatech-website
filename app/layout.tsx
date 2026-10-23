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
        {/* Decides, before anything is drawn, whether the home page plays its opening.
            A plain inline script runs while the page is still being read, so the opening
            is already in place on the very first frame (no flash of the hero first).
            Rule: on the home page, when the visitor has not been on the website for
            5 minutes. Time in the admin does not count as a visit. Visitors who have
            asked their device for reduced motion are not shown it. */}
        <script id="mj-open" dangerouslySetInnerHTML={{ __html: `(function(){
  var root = document.documentElement;
  if (root.hasAttribute("data-intro")) return;
  if (location.pathname.indexOf("/admin") === 0) { root.setAttribute("data-intro", "off"); return; }
  var show = false;
  try {
    var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var k = "mj-last-visit", last = Number(localStorage.getItem(k)) || 0, now = Date.now();
    show = !calm && location.pathname === "/" && now - last > 300000;
    localStorage.setItem(k, String(now));
  } catch (e) { show = location.pathname === "/"; }
  root.setAttribute("data-intro", show ? "on" : "off");
})();` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
