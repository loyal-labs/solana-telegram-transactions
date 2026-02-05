import { STARS_TO_USD } from "@/lib/constants";

export const calculateStarsFee = (
  amountSol: number,
  solPriceUsd: number
): number => {
  const amountUsd = amountSol * solPriceUsd;
  const starsFee = amountUsd / STARS_TO_USD;
  return Math.ceil(starsFee * 10000) / 10000;
};
