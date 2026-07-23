/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // three.js / reactflow ke liye transpile
  transpilePackages: ["three"],
};

export default nextConfig;
