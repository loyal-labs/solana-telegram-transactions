import { execSync } from "child_process";
import type { NextConfig } from "next";

function getGitInfo() {
  try {
    const commitHash = execSync("git rev-parse --short HEAD").toString().trim();
    const branch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
    return { commitHash, branch };
  } catch {
    return {
      commitHash: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "unknown",
      branch: process.env.VERCEL_GIT_COMMIT_REF ?? "unknown",
    };
  }
}

const { commitHash, branch } = getGitInfo();

const mixpanelProxyPathRaw = process.env.NEXT_PUBLIC_MIXPANEL_PROXY_PATH?.trim();
const mixpanelProxyPath = mixpanelProxyPathRaw
  ? mixpanelProxyPathRaw.startsWith("/")
    ? mixpanelProxyPathRaw
    : `/${mixpanelProxyPathRaw}`
  : "/ingest";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_GIT_COMMIT_HASH: commitHash,
    NEXT_PUBLIC_GIT_BRANCH: branch,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
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
