"use client";

import {
  type PortfolioPosition,
  type PortfolioSnapshot,
  type WalletActivity,
} from "@loyal-labs/solana-wallet";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useMemo, useState } from "react";

import type {
  ActivityRow,
  TokenRow,
  TransactionDetail,
} from "@/components/wallet-sidebar/types";

import { useSolanaWalletDataClient } from "./use-solana-wallet-data-client";

export type WalletDesktopData = {
  walletAddress: string | null;
  isConnected: boolean;
  isLoading: boolean;
  balanceWhole: string;
  balanceFraction: string;
  balanceSolLabel: string;
  walletLabel: string;
  tokenRows: TokenRow[];
  allTokenRows: TokenRow[];
  activityRows: ActivityRow[];
  allActivityRows: ActivityRow[];
  transactionDetails: Record<string, TransactionDetail>;
};

const ICON_BY_SYMBOL: Record<string, string> = {
  SOL: "/hero-new/solana.png",
  USDC: "/hero-new/usdc.png",
  BNB: "/hero-new/bnb.png",
};
const EMPTY_POSITIONS: PortfolioPosition[] = [];

function resolveTokenIcon(position: PortfolioPosition): string {
  return ICON_BY_SYMBOL[position.asset.symbol] ?? "/hero-new/Wallet-Cover.png";
}

function formatUsd(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "$0.00";
  }

  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatTokenBalance(balance: number): string {
  return balance.toLocaleString("en-US", {
    minimumFractionDigits: balance >= 1 ? 0 : 2,
    maximumFractionDigits: balance >= 1 ? 4 : 6,
  });
}

function formatSolAmount(lamports: number): string {
  return (lamports / 1_000_000_000).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
}

function formatTimestamp(timestamp: number | null): { date: string; time: string } {
  const date = timestamp ? new Date(timestamp) : new Date();
  return {
    date: date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

function resolvePositionByMint(
  positions: PortfolioPosition[],
  mint: string | undefined
): PortfolioPosition | undefined {
  if (!mint) {
    return undefined;
  }

  return positions.find((position) => position.asset.mint === mint);
}

function getActivityDisplay(
  activity: WalletActivity,
  positions: PortfolioPosition[],
  solPriceUsd: number | null
): {
  symbol: string;
  icon: string;
  amount: string;
  usdValue: number | null;
  counterparty: string;
} {
  switch (activity.type) {
    case "swap": {
      const fromPosition = resolvePositionByMint(positions, activity.fromToken.mint);
      return {
        symbol: fromPosition?.asset.symbol ?? "SOL",
        icon: fromPosition ? resolveTokenIcon(fromPosition) : ICON_BY_SYMBOL.SOL,
        amount: activity.fromToken.amount ?? formatSolAmount(activity.amountLamports),
        usdValue:
          typeof fromPosition?.priceUsd === "number"
            ? parseFloat(activity.fromToken.amount) * fromPosition.priceUsd
            : null,
        counterparty: "Swap",
      };
    }
    case "token_transfer":
    case "secure":
    case "unshield": {
      const position = resolvePositionByMint(positions, activity.token.mint);
      return {
        symbol: position?.asset.symbol ?? "TOKEN",
        icon: position ? resolveTokenIcon(position) : "/hero-new/Wallet-Cover.png",
        amount: activity.token.amount,
        usdValue:
          typeof position?.priceUsd === "number"
            ? parseFloat(activity.token.amount) * position.priceUsd
            : null,
        counterparty:
          activity.counterparty ??
          (activity.type === "secure"
            ? "Secure"
            : activity.type === "unshield"
              ? "Unshield"
              : activity.direction === "in"
                ? "Unknown sender"
                : "Unknown recipient"),
      };
    }
    case "program_action": {
      if (activity.token) {
        const position = resolvePositionByMint(positions, activity.token.mint);
        return {
          symbol: position?.asset.symbol ?? "TOKEN",
          icon: position
            ? resolveTokenIcon(position)
            : "/hero-new/Wallet-Cover.png",
          amount: activity.token.amount,
          usdValue:
            typeof position?.priceUsd === "number"
              ? parseFloat(activity.token.amount) * position.priceUsd
              : null,
          counterparty: activity.action,
        };
      }

      return {
        symbol: "SOL",
        icon: ICON_BY_SYMBOL.SOL,
        amount: formatSolAmount(activity.amountLamports),
        usdValue:
          typeof solPriceUsd === "number"
            ? (activity.amountLamports / 1_000_000_000) * solPriceUsd
            : null,
        counterparty: activity.action,
      };
    }
    case "sol_transfer":
    default:
      return {
        symbol: "SOL",
        icon: ICON_BY_SYMBOL.SOL,
        amount: formatSolAmount(activity.amountLamports),
        usdValue:
          typeof solPriceUsd === "number"
            ? (activity.amountLamports / 1_000_000_000) * solPriceUsd
            : null,
        counterparty:
          activity.counterparty ??
          (activity.direction === "in" ? "Unknown sender" : "Unknown recipient"),
      };
  }
}

function mapActivityToRowAndDetail(
  activity: WalletActivity,
  positions: PortfolioPosition[],
  solPriceUsd: number | null
): { row: ActivityRow; detail: TransactionDetail } {
  const display = getActivityDisplay(activity, positions, solPriceUsd);
  const isReceived = activity.direction === "in";
  const timestamp = formatTimestamp(activity.timestamp);
  const amount = `${isReceived ? "+" : "-"}${display.amount} ${display.symbol}`;

  const row: ActivityRow = {
    id: activity.signature,
    type: isReceived ? "received" : "sent",
    counterparty: display.counterparty,
    amount,
    timestamp: timestamp.time,
    date: timestamp.date,
    icon: display.icon,
  };

  return {
    row,
    detail: {
      activity: row,
      usdValue: formatUsd(display.usdValue),
      status: activity.status === "failed" ? "Failed" : "Completed",
      networkFee: `${formatSolAmount(activity.feeLamports)} SOL`,
      networkFeeUsd: formatUsd(
        typeof solPriceUsd === "number"
          ? (activity.feeLamports / 1_000_000_000) * solPriceUsd
          : null
      ),
    },
  };
}

function mapPositionToTokenRow(position: PortfolioPosition): TokenRow {
  return {
    id: position.asset.mint,
    symbol: position.asset.symbol,
    price: formatUsd(position.priceUsd),
    amount: formatTokenBalance(position.totalBalance),
    value: formatUsd(position.totalValueUsd),
    icon: resolveTokenIcon(position),
  };
}

export function useWalletDesktopData(): WalletDesktopData {
  const client = useSolanaWalletDataClient();
  const wallet = useWallet();
  const walletAddress = wallet.publicKey?.toBase58() ?? null;
  const [portfolioSnapshot, setPortfolioSnapshot] =
    useState<PortfolioSnapshot | null>(null);
  const [activities, setActivities] = useState<WalletActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!(wallet.connected && wallet.publicKey)) {
      setPortfolioSnapshot(null);
      setActivities([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    void Promise.all([
      client.getPortfolio(wallet.publicKey),
      client.getActivity(wallet.publicKey, { limit: 25 }),
    ])
      .then(([nextPortfolio, history]) => {
        if (cancelled) {
          return;
        }

        setPortfolioSnapshot(nextPortfolio);
        setActivities(history.activities);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load wallet desktop data", error);
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [client, wallet.connected, wallet.publicKey]);

  useEffect(() => {
    if (!(wallet.connected && wallet.publicKey)) {
      return;
    }

    let closed = false;
    let unsubscribePortfolio: (() => Promise<void>) | null = null;
    let unsubscribeActivity: (() => Promise<void>) | null = null;

    void client
      .subscribePortfolio(
        wallet.publicKey,
        (snapshot) => {
          if (!closed) {
            setPortfolioSnapshot(snapshot);
          }
        },
        { emitInitial: false }
      )
      .then((unsubscribe) => {
        unsubscribePortfolio = unsubscribe;
      })
      .catch((error) => {
        console.error("Failed to subscribe to wallet portfolio", error);
      });

    void client
      .subscribeActivity(
        wallet.publicKey,
        (activity) => {
          if (closed) {
            return;
          }

          setActivities((currentActivities) => {
            const matchIndex = currentActivities.findIndex(
              (currentActivity) => currentActivity.signature === activity.signature
            );

            if (matchIndex >= 0) {
              const nextActivities = [...currentActivities];
              nextActivities[matchIndex] = {
                ...currentActivities[matchIndex],
                ...activity,
              };
              return nextActivities.sort(
                (left, right) => (right.timestamp ?? 0) - (left.timestamp ?? 0)
              );
            }

            return [activity, ...currentActivities].sort(
              (left, right) => (right.timestamp ?? 0) - (left.timestamp ?? 0)
            );
          });
        },
        { emitInitial: false }
      )
      .then((unsubscribe) => {
        unsubscribeActivity = unsubscribe;
      })
      .catch((error) => {
        console.error("Failed to subscribe to wallet activity", error);
      });

    return () => {
      closed = true;
      if (unsubscribePortfolio) {
        void unsubscribePortfolio();
      }
      if (unsubscribeActivity) {
        void unsubscribeActivity();
      }
    };
  }, [client, wallet.connected, wallet.publicKey]);

  const positions = portfolioSnapshot?.positions ?? EMPTY_POSITIONS;
  const totals = portfolioSnapshot?.totals ?? {
    totalUsd: 0,
    totalSol: null,
    effectiveSolPriceUsd: null,
  };

  const allTokenRows = useMemo(
    () => positions.filter((position) => position.totalBalance > 0).map(mapPositionToTokenRow),
    [positions]
  );

  const activityData = useMemo(() => {
    const details: Record<string, TransactionDetail> = {};
    const rows = activities.map((activity) => {
      const mapped = mapActivityToRowAndDetail(
        activity,
        positions,
        totals.effectiveSolPriceUsd
      );
      details[mapped.row.id] = mapped.detail;
      return mapped.row;
    });

    return { rows, details };
  }, [activities, positions, totals.effectiveSolPriceUsd]);

  const formattedBalance = formatUsd(totals.totalUsd);
  const balanceParts = formattedBalance.split(".");
  const walletLabel = walletAddress
    ? `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)} · Solana`
    : "No account";

  return {
    walletAddress,
    isConnected: Boolean(wallet.connected && walletAddress),
    isLoading,
    balanceWhole: balanceParts[0] ?? "$0",
    balanceFraction: balanceParts[1] ? `.${balanceParts[1]}` : "",
    balanceSolLabel:
      totals.totalSol === null
        ? "0 SOL"
        : `${totals.totalSol.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 5,
          })} SOL`,
    walletLabel,
    tokenRows: allTokenRows.slice(0, 2),
    allTokenRows,
    activityRows: activityData.rows.slice(0, 2),
    allActivityRows: activityData.rows,
    transactionDetails: activityData.details,
  };
}
