/** @type {import('next').NextConfig} */

/* What the browser is allowed to load and do on this site. Anything not listed is
 * refused, so an injected script has nowhere to send data and no way to run. */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",          // Next.js ships small inline scripts
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.indexnow.org",
  "form-action 'self'",
  "frame-ancestors 'none'",                      // nobody can frame the site
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

/* The admin also needs the microphone (talking to Arik) and to play Arik's voice. */
const adminCsp = csp.replace("img-src 'self' data: blob:", "img-src 'self' data: blob:; media-src 'self' data: blob:");
const adminHeaders = [
  { key: "Content-Security-Policy", value: adminCsp },
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), payment=(), usb=(), interest-cohort=()" },
];

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig = {
  // The stylesheet rides along with the page: one request less before the first paint.
  experimental: { inlineCss: true },
  reactStrictMode: true,
  poweredByHeader: false,          // stop announcing the software we run
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // The admin is never cached anywhere and never indexed.
        source: "/admin/:path*",
        headers: [
          ...adminHeaders,
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, private" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
      {
        /* Service workers are always re-checked, so an update reaches phones on the next open. */
        source: "/:sw(sw|admin-sw).js",
        headers: [{ key: "Cache-Control", value: "no-cache, max-age=0, must-revalidate" }],
      },
      { source: "/admin", headers: [
        ...adminHeaders,
        { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, private" },
        { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
      ] },
    ];
  },
};

export default nextConfig;
