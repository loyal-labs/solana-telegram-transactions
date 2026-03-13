import { fetchJson } from "../core/http";
import { JUPITER_API_BASE_URL } from "./constants";

type JupiterPriceResponse = {
  data: Record<string, { id: string; price: string } | undefined>;
};

export async function fetchTokenPricesByMints(
  mints: string[],
): Promise<Map<string, number>> {
  if (mints.length === 0) return new Map();

  const url = `${JUPITER_API_BASE_URL}/price/v2?ids=${mints.join(",")}`;
  const response = await fetchJson<JupiterPriceResponse>(url, {
    method: "GET",
  });

  const prices = new Map<string, number>();
  for (const [mint, data] of Object.entries(response.data)) {
    if (data?.price) {
      const price = Number(data.price);
      if (Number.isFinite(price) && price > 0) {
        prices.set(mint, price);
      }
    }
  }
  return prices;
}
