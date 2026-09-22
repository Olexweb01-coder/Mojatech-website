/** @type {import('next').NextConfig} */
const nextConfig = {
  // The stylesheet rides along with the page: one request less before the first paint.
  experimental: { inlineCss: true },
  reactStrictMode: true,
};
export default nextConfig;
