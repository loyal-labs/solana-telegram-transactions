import {
  type AssetBalance,
  createSolanaWalletDataClient,
  NATIVE_SOL_MINT,
  type SecureBalanceMap,
  type SolanaWalletDataClient,
} from "@loyal-labs/solana-wallet";
import { PublicKey } from "@solana/web3.js";

import { fetchLoyalDeposits } from "@/lib/solana/deposits/loyal-deposits";
import { getSolanaEnv } from "@/lib/solana/rpc/connection";

const clients = new Map<string, SolanaWalletDataClient>();

async function fetchSecureHoldings(args: {
  owner: PublicKey;
  tokenMints: PublicKey[];
}): Promise<SecureBalanceMap> {
  const nativeMint = new PublicKey(NATIVE_SOL_MINT);

  const [nativeDeposits, tokenDeposits] = await Promise.all([
    fetchLoyalDeposits(args.owner, [nativeMint]),
    fetchLoyalDeposits(
      args.owner,
      args.tokenMints.filter((mint) => !mint.equals(nativeMint))
    )
  ]);

  return new Map<string, bigint>(
    [...nativeDeposits, ...tokenDeposits].map(([mint, amount]) => [
      mint.toBase58(),
      BigInt(Math.round(amount)),
    ])
  );
}

export function getTelegramWalletDataClient(): SolanaWalletDataClient {
  const env = getSolanaEnv();
  const cached = clients.get(env);
  if (cached) {
    return cached;
  }

  const client = createSolanaWalletDataClient({
    env,
    secureBalanceProvider: async ({ owner, tokenMints, assetBalances }) =>
      fetchSecureHoldings({
        owner,
        tokenMints: tokenMints.filter((mint) =>
          assetBalances.some(
            (assetBalance: AssetBalance) => assetBalance.asset.mint === mint.toBase58()
          )
        ),
      })
  });

  clients.set(env, client);
  return client;
}
