import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: [
  {
    "protocol": "https",
    "hostname": "images.pexels.com",
    "pathname": "/photos/23531833/pexels-photo-23531833.jpeg"
  },
  {
    "protocol": "https",
    "hostname": "images.pexels.com",
    "pathname": "/photos/7671167/pexels-photo-7671167.jpeg"
  },
  {
    "protocol": "https",
    "hostname": "images.pexels.com",
    "pathname": "/photos/15751888/pexels-photo-15751888.jpeg"
  },
  {
    "protocol": "https",
    "hostname": "images.pexels.com",
    "pathname": "/photos/35933227/pexels-photo-35933227.jpeg"
  },
  {
    "protocol": "https",
    "hostname": "images.pexels.com",
    "pathname": "/photos/27256448/pexels-photo-27256448.jpeg"
  },
  {
    "protocol": "https",
    "hostname": "images.pexels.com",
    "pathname": "/photos/26954381/pexels-photo-26954381.jpeg"
  },
  {
    "protocol": "https",
    "hostname": "images.pexels.com",
    "pathname": "/photos/3892369/pexels-photo-3892369.jpeg"
  }
],
  },
  reactStrictMode: true,
  headers: async () => [
    {
      source: "/(.*)",
      headers: securityHeaders,
    },
  ],
};

export default nextConfig;
