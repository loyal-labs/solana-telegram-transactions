const SOL_PRICE_ENDPOINT =
  "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";

export const fetchSolUsdPrice = async (): Promise<number> => {
  const response = await fetch(SOL_PRICE_ENDPOINT);

  if (!response.ok) {
    throw new Error(`Failed to fetch SOL price: ${response.status}`);
  }

  const data = (await response.json()) as {
    solana?: { usd?: number };
  };

  const usdPrice = data.solana?.usd;

  if (typeof usdPrice !== "number") {
    throw new Error("Unexpected SOL price response");
  }

  return usdPrice;
};

// Temporary backwards-compatibility export; prefer fetchSolUsdPrice going forward.
export const fetchSolPriceUsd = fetchSolUsdPrice;
