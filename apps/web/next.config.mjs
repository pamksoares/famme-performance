/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // gera bundle self-contained para container
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
};

export default nextConfig;
