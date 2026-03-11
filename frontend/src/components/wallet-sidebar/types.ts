export type RightSidebarTab = "portfolio" | "send" | "swap";

export interface HeroRightSidebarProps {
  isOpen: boolean;
  activeTab: RightSidebarTab;
  onClose: () => void;
  onTabChange: (tab: RightSidebarTab) => void;
  isBalanceHidden: boolean;
  onBalanceHiddenChange: (hidden: boolean) => void;
}

export interface TokenRow {
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
  | { type: "tokenSelect"; field: "from" | "to" };

export const swapTokens: SwapToken[] = [
  { symbol: "USDC", icon: "/hero-new/usdc.png", price: 0.9997, balance: 16285 },
  { symbol: "SOL", icon: "/hero-new/solana.png", price: 99.03, balance: 14.98765 },
  { symbol: "USDT", icon: "/hero-new/usdt.png", price: 0.99, balance: 1267 },
  { symbol: "BNB", icon: "/hero-new/bnb.png", price: 559.06, balance: 0 },
  { symbol: "WBTC", icon: "/hero-new/wbtc.png", price: 76375.83, balance: 0 },
];

export const tokens: TokenRow[] = [
  {
    symbol: "USDC",
    price: "$0.99",
    amount: "1,267",
    value: "$2.12",
    icon: "/hero-new/usdc.png",
  },
  {
    symbol: "SOL",
    price: "$99.03",
    amount: "1,267",
    value: "$2.12",
    icon: "/hero-new/solana.png",
  },
];

// Extended tokens for "Show All" view
export const allTokens: TokenRow[] = [
  ...tokens,
  {
    symbol: "USDC",
    price: "$0.99",
    amount: "450",
    value: "$449.55",
    icon: "/hero-new/usdc.png",
  },
  {
    symbol: "SOL",
    price: "$99.03",
    amount: "3.5",
    value: "$346.61",
    icon: "/hero-new/solana.png",
  },
];

export const allActivities: ActivityRow[] = [
  {
    id: "1",
    type: "received",
    counterparty: "UQAt\u2026qZir",
    amount: "+200.00 USDC",
    timestamp: "2:58 PM",
    date: "November 25",
    icon: "/hero-new/usdc.png",
  },
  {
    id: "2",
    type: "sent",
    counterparty: "UQAt\u2026qZir",
    amount: "\u22120.5 SOL",
    timestamp: "3:06 AM",
    date: "November 25",
    icon: "/hero-new/solana.png",
  },
  {
    id: "3",
    type: "received",
    counterparty: "HxR4\u2026mK2p",
    amount: "+50.00 USDC",
    timestamp: "11:22 AM",
    date: "November 24",
    icon: "/hero-new/usdc.png",
  },
  {
    id: "4",
    type: "sent",
    counterparty: "3vBt\u2026nW8q",
    amount: "\u22121.2 SOL",
    timestamp: "9:15 AM",
    date: "November 24",
    icon: "/hero-new/solana.png",
  },
  {
    id: "5",
    type: "received",
    counterparty: "UQAt\u2026qZir",
    amount: "+100.00 USDC",
    timestamp: "4:30 PM",
    date: "November 23",
    icon: "/hero-new/usdc.png",
  },
];

// Subset for portfolio overview
export const activities = allActivities.slice(0, 2).map((a) => ({
  ...a,
  timestamp: `${a.date.split(" ")[0].slice(0, 3)} ${a.date.split(" ")[1]}, ${a.timestamp}`,
}));

export function activityToDetail(activity: ActivityRow): TransactionDetail {
  const token = activity.amount.includes("USDC") ? "USDC" : "SOL";
  const numericAmount = Number.parseFloat(
    activity.amount.replace(/[^0-9.]/g, ""),
  );
  const usdValue = `$${(numericAmount * (token === "SOL" ? 99.03 : 1)).toFixed(2)}`;

  return {
    activity,
    usdValue,
    status: "Completed",
    networkFee: "0.00005 SOL",
    networkFeeUsd: "$0.00",
  };
}
