import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],

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
