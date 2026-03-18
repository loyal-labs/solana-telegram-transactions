import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],

  alias: {
    "@loyal-labs/wallet-core": new URL(
      "../packages/wallet-core/src",
      import.meta.url,
    ).pathname,
  },

  manifest: ({ mode }) => ({
    name: mode === "development" ? "Loyal (Dev)" : "Loyal",
    description: "Solana wallet for Telegram communities",
    permissions: ["storage", "sidePanel"],
    host_permissions: [
      "https://api.mainnet-beta.solana.com/*",
      "https://*.helius-rpc.com/*",
      "https://api.jup.ag/*",
    ],
  }),
});
