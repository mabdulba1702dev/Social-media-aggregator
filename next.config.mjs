/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Embed provider CDNs get added here as platforms are wired up
    // (PRD §8) — e.g. Instagram/Threads CDN hosts for cached thumbnails.
    remotePatterns: []
  }
};

export default nextConfig;
