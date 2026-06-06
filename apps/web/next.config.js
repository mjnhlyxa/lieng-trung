/** @type {import('next').NextConfig} */
const path = require("path");
const nextConfig = {
  reactStrictMode: true,
  distDir: path.resolve(__dirname, "../.next"),
};

module.exports = nextConfig;
