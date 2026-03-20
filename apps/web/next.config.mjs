/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
  allowedDevOrigins: ["*.replit.dev", "*.worf.replit.dev", "*.repl.co"],
};

export default nextConfig;
