export const WALLET_ADDRESS = "So11111111111111111111111111111111111111112";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const BONK_MINT = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6nBoP4ZkQ8z3ESj";

export const heliusAssetResponseFixture = {
  jsonrpc: "2.0" as const,
  id: "wallet-portfolio",
  result: {
    nativeBalance: {
      lamports: 2_000_000_000,
      price_per_sol: 100,
      total_price: 200,
    },
    items: [
      {
        id: USDC_MINT,
        token_info: {
          symbol: "USDC",
          balance: 5_250_000,
          decimals: 6,
          price_info: {
            price_per_token: 1,
            total_price: 5.25,
          },
        },
        content: {
          metadata: {
            name: "USD Coin",
          },
          links: {
            image: "https://cdn.example.com/usdc.png",
          },
        },
      },
      {
        id: BONK_MINT,
        token_info: {
          symbol: "BONK",
          balance: 125_000_000,
          decimals: 5,
          price_info: {
            price_per_token: 0.00002,
            total_price: 25,
          },
        },
        content: {
          metadata: {
            name: "Bonk",
          },
        },
      },
    ],
  },
};
