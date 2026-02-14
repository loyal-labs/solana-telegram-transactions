import type { NextConfig } from "next";

const mixpanelProxyPathRaw = process.env.NEXT_PUBLIC_MIXPANEL_PROXY_PATH?.trim();
const mixpanelProxyPath = mixpanelProxyPathRaw
  ? mixpanelProxyPathRaw.startsWith("/")
    ? mixpanelProxyPathRaw
    : `/${mixpanelProxyPathRaw}`
  : "/ingest";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "t.me",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: `${mixpanelProxyPath}/:path*`,
        destination: "https://api-js.mixpanel.com/:path*",
      },
    ];
  },
};

export default nextConfig;
