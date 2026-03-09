import "server-only";

import {
  privateTransferModifyBalanceEvents,
  privateTransferTokenCatalog,
  privateTransferVaultHoldings,
} from "@loyal-labs/db-core/schema";
import { and, eq, gte, lt } from "drizzle-orm";

import { getDatabase } from "@/lib/core/database";

export type ShieldDayPoint = {
  date: string;
  shielded: number;
  unshielded: number;
};

export type ShieldedAsset = {
  priceUsd: number | null;
  symbol: string;
  tokenMint: string;
  totalAmount: number;
  totalValueUsd: number | null;
  userCount: string;
};

export type TransfersData = {
  assets: ShieldedAsset[];
  shieldPoints: ShieldDayPoint[];
  totalShielded: number;
  totalUnshielded: number;
  tvl: number;
};

type HoldingsRow = {
  amountRaw: string;
  decimals: number | null;
  priceUsd: string | null;
  symbol: string | null;
  tokenMint: string;
};

type FlowRow = {
  amountRaw: string;
  decimals: number | null;
  flow: "shield" | "unshield";
  occurredAt: Date;
  priceUsd: string | null;
};

function getWindowBoundsUtc() {
  const now = new Date();
  const endExclusive = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  const startInclusive = new Date(endExclusive);
  startInclusive.setUTCDate(startInclusive.getUTCDate() - 30);

  return { startInclusive, endExclusive };
}

function getDayKeys(startInclusive: Date, numberOfDays: number) {
  const dayKeys: string[] = [];

  for (let i = 0; i < numberOfDays; i += 1) {
    const day = new Date(startInclusive);
    day.setUTCDate(startInclusive.getUTCDate() + i);
    dayKeys.push(day.toISOString().slice(0, 10));
  }

  return dayKeys;
}

function toNumber(value: number | string | null | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function amountRawToUi(amountRaw: string, decimals: number | null): number {
  const raw = toNumber(amountRaw) ?? 0;
  const safeDecimals = decimals ?? 0;

  return raw / Math.pow(10, safeDecimals);
}

function normalizeDayUtc(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildShieldSeries(dayKeys: string[], rows: FlowRow[]) {
  const totalsByDay = new Map<string, { shielded: number; unshielded: number }>();

  dayKeys.forEach((dayKey) => {
    totalsByDay.set(dayKey, { shielded: 0, unshielded: 0 });
  });

  for (const row of rows) {
    const dayKey = normalizeDayUtc(row.occurredAt);
    const current = totalsByDay.get(dayKey);
    if (!current) {
      continue;
    }

    const priceUsd = toNumber(row.priceUsd) ?? 0;
    const amountUsd = amountRawToUi(row.amountRaw, row.decimals) * priceUsd;

    if (row.flow === "shield") {
      current.shielded += amountUsd;
    } else {
      current.unshielded += amountUsd;
    }
  }

  const points: ShieldDayPoint[] = [];
  let totalShielded = 0;
  let totalUnshielded = 0;

  dayKeys.forEach((dayKey) => {
    const totals = totalsByDay.get(dayKey) ?? { shielded: 0, unshielded: 0 };
    totalShielded += totals.shielded;
    totalUnshielded += totals.unshielded;
    points.push({
      date: dayKey,
      shielded: Number(totals.shielded.toFixed(2)),
      unshielded: Number(totals.unshielded.toFixed(2)),
    });
  });

  return {
    points,
    totalShielded: Number(totalShielded.toFixed(2)),
    totalUnshielded: Number(totalUnshielded.toFixed(2)),
  };
}

export async function getTransfersData(): Promise<TransfersData> {
  const db = getDatabase();
  const { startInclusive, endExclusive } = getWindowBoundsUtc();
  const dayKeys = getDayKeys(startInclusive, 30);

  const [holdingsRows, flowRows] = await Promise.all([
    db
      .select({
        amountRaw: privateTransferVaultHoldings.amountRaw,
        decimals: privateTransferTokenCatalog.decimals,
        priceUsd: privateTransferTokenCatalog.lastPriceUsd,
        symbol: privateTransferTokenCatalog.symbol,
        tokenMint: privateTransferVaultHoldings.tokenMint,
      })
      .from(privateTransferVaultHoldings)
      .leftJoin(
        privateTransferTokenCatalog,
        eq(
          privateTransferTokenCatalog.tokenMint,
          privateTransferVaultHoldings.tokenMint
        )
      ),
    db
      .select({
        amountRaw: privateTransferModifyBalanceEvents.amountRaw,
        decimals: privateTransferTokenCatalog.decimals,
        flow: privateTransferModifyBalanceEvents.flow,
        occurredAt: privateTransferModifyBalanceEvents.occurredAt,
        priceUsd: privateTransferTokenCatalog.lastPriceUsd,
      })
      .from(privateTransferModifyBalanceEvents)
      .leftJoin(
        privateTransferTokenCatalog,
        eq(
          privateTransferTokenCatalog.tokenMint,
          privateTransferModifyBalanceEvents.tokenMint
        )
      )
      .where(
        and(
          gte(privateTransferModifyBalanceEvents.occurredAt, startInclusive),
          lt(privateTransferModifyBalanceEvents.occurredAt, endExclusive)
        )
      ),
  ]);

  const assets: ShieldedAsset[] = holdingsRows.map((row: HoldingsRow) => {
    const totalAmount = amountRawToUi(row.amountRaw, row.decimals);
    const priceUsd = toNumber(row.priceUsd);
    const totalValueUsd = priceUsd === null ? null : totalAmount * priceUsd;

    return {
      priceUsd,
      symbol: row.symbol?.trim() || "TOKEN",
      tokenMint: row.tokenMint,
      totalAmount,
      totalValueUsd: totalValueUsd === null ? null : Number(totalValueUsd.toFixed(2)),
      userCount: "N/A",
    };
  });

  const shieldSeries = buildShieldSeries(dayKeys, flowRows as FlowRow[]);
  const tvl = assets.reduce(
    (sum, asset) => sum + (asset.totalValueUsd ?? 0),
    0
  );

  return {
    assets,
    shieldPoints: shieldSeries.points,
    totalShielded: shieldSeries.totalShielded,
    totalUnshielded: shieldSeries.totalUnshielded,
    tvl: Number(tvl.toFixed(2)),
  };
}
