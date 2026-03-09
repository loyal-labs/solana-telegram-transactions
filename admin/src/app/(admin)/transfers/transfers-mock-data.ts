function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function rand(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

// --- Shield / Unshield 30-day data ---

export type ShieldDayPoint = {
  date: string;
  shielded: number;
  unshielded: number;
};

export function getShieldUnshieldData(): {
  points: ShieldDayPoint[];
  totalShielded: number;
  totalUnshielded: number;
} {
  const points: ShieldDayPoint[] = [];
  let totalShielded = 0;
  let totalUnshielded = 0;

  for (let i = 29; i >= 0; i--) {
    const shielded = rand(800, 5000);
    const unshielded = rand(400, 3000);
    totalShielded += shielded;
    totalUnshielded += unshielded;
    points.push({ date: daysAgo(i), shielded, unshielded });
  }

  return { points, totalShielded, totalUnshielded };
}

// --- TVL ---

export function getTvl(): number {
  return 284_319.42;
}

// --- Gasless claims ---

export type GaslessClaimPoint = {
  date: string;
  amount: number;
};

export function getGaslessClaimsData(): {
  points: GaslessClaimPoint[];
  totalSpent: number;
} {
  const points: GaslessClaimPoint[] = [];
  let totalSpent = 0;

  for (let i = 29; i >= 0; i--) {
    const amount = parseFloat((Math.random() * 0.8 + 0.05).toFixed(4));
    totalSpent += amount;
    points.push({ date: daysAgo(i), amount });
  }

  return { points, totalSpent: parseFloat(totalSpent.toFixed(4)) };
}

// --- Shielded assets table ---

export type ShieldedAsset = {
  tokenMint: string;
  symbol: string;
  userCount: number;
  totalAmount: number;
  priceUsd: number;
};

export function getShieldedAssets(): ShieldedAsset[] {
  return [
    {
      tokenMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      symbol: "USDC",
      userCount: 142,
      totalAmount: 198_450.32,
      priceUsd: 1.0,
    },
    {
      tokenMint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      symbol: "USDT",
      userCount: 87,
      totalAmount: 62_340.18,
      priceUsd: 1.0,
    },
    {
      tokenMint: "So11111111111111111111111111111111111111112",
      symbol: "SOL",
      userCount: 54,
      totalAmount: 1_285.7,
      priceUsd: 178.42,
    },
    {
      tokenMint: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
      symbol: "WETH",
      userCount: 12,
      totalAmount: 8.45,
      priceUsd: 3_412.5,
    },
  ];
}
