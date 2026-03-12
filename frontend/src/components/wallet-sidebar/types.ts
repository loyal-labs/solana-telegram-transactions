export type RightSidebarTab = "portfolio" | "send" | "swap";

export interface HeroRightSidebarProps {
  isOpen: boolean;
  activeTab: RightSidebarTab;
  onClose: () => void;
  onTabChange: (tab: RightSidebarTab) => void;
  isBalanceHidden: boolean;
  onBalanceHiddenChange: (hidden: boolean) => void;
  showQuickActions?: boolean;
}

export interface TokenRow {
  id?: string;
  symbol: string;
  price: string;
  amount: string;
  value: string;
  icon: string;
}

export interface ActivityRow {
  id: string;
  type: "received" | "sent";
  counterparty: string;
  amount: string;
  timestamp: string;
  date: string;
  icon: string;
}

export interface TransactionDetail {
  activity: ActivityRow;
  usdValue: string;
  status: string;
  networkFee: string;
  networkFeeUsd: string;
}

export interface SwapToken {
  mint?: string;
  symbol: string;
  icon: string;
  price: number;
  balance: number;
}

export type SubView =
  | null
  | "allTokens"
  | "allActivity"
  | { type: "transaction"; detail: TransactionDetail; from: "portfolio" | "allActivity" }
  | { type: "tokenSelect"; field: "from" | "to" }
  | { type: "sendTokenSelect" };

export const swapTokens: SwapToken[] = [
  { symbol: "USDC", icon: "/hero-new/usdc.png", price: 0.9997, balance: 16285 },
  { symbol: "SOL", icon: "/hero-new/solana.png", price: 99.03, balance: 14.98765 },
  { symbol: "USDT", icon: "/hero-new/usdt.png", price: 0.99, balance: 1267 },
  { symbol: "BNB", icon: "/hero-new/bnb.png", price: 559.06, balance: 0 },
  { symbol: "WBTC", icon: "/hero-new/wbtc.png", price: 76375.83, balance: 0 },
];
