import { getTokenIconUrl } from "@/lib/token-icon";

export type RightSidebarTab = "portfolio" | "receive" | "send" | "swap" | "sign-in";

export interface TokenRow {
  id?: string;
  symbol: string;
  price: string;
  amount: string;
  value: string;
  icon: string;
  isSecured?: boolean;
}

export interface ActivityRow {
  id: string;
  type: "received" | "sent" | "shielded" | "unshielded";
  counterparty: string;
  amount: string;
  timestamp: string;
  date: string;
  icon: string;
  isPrivate?: boolean;
  /** Epoch milliseconds for sort order — absent in legacy localStorage rows */
  rawTimestamp?: number;
}

export interface TransactionDetail {
  activity: ActivityRow;
  usdValue: string;
  status: string;
  networkFee: string;
  networkFeeUsd: string;
  isPrivate?: boolean;
}

export interface SwapToken {
  mint?: string;
  symbol: string;
  icon: string;
  price: number;
  balance: number;
}

export type SwapMode = "swap" | "shield";

export interface FormButtonProps {
  label: string;
  disabled: boolean;
  onClick: () => void;
}

export type SubView =
  | null
  | "allTokens"
  | "allActivity"
  | { type: "transaction"; detail: TransactionDetail; from: "portfolio" | "allActivity" }
  | { type: "tokenSelect"; field: "from" | "to" }
  | { type: "sendTokenSelect" }
  | { type: "shieldTokenSelect" };

export const LOYL_TOKEN: SwapToken = {
  mint: "LYLikzBQtpa9ZgVrJsqYGQpR3cC1WMJrBHaXGrQmeta",
  symbol: "LOYAL",
  icon: "https://avatars.githubusercontent.com/u/210601628?s=200&v=4",
  price: 0,
  balance: 0,
};

export const swapTokens: SwapToken[] = [
  { symbol: "USDC", icon: getTokenIconUrl("USDC"), price: 0.9997, balance: 16285 },
  { symbol: "SOL", icon: getTokenIconUrl("SOL"), price: 99.03, balance: 14.98765 },
  { symbol: "USDT", icon: getTokenIconUrl("USDT"), price: 0.99, balance: 1267 },
  { symbol: "BNB", icon: getTokenIconUrl("BNB"), price: 559.06, balance: 0 },
  { symbol: "WBTC", icon: getTokenIconUrl("WBTC"), price: 76375.83, balance: 0 },
];
