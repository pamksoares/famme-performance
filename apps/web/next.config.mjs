/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
  allowedDevOrigins: ["*.replit.dev", "*.worf.replit.dev", "*.repl.co"],
  async redirects() {
    return [
      { source: "/", destination: "/landing.html", permanent: false },
    ];
  },
};

export default nextConfig;
