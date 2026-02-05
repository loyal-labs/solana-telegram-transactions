import { Connection } from "@solana/web3.js";

import { MAGICBLOCK_DEVNET_RPC_URL } from "./constants";

let cachedEphemeralConnection: Connection | null = null;

export const getEphemeralConnection = (): Connection => {
  if (cachedEphemeralConnection) return cachedEphemeralConnection;

  cachedEphemeralConnection = new Connection(MAGICBLOCK_DEVNET_RPC_URL, {
    commitment: "confirmed",
  });
  return cachedEphemeralConnection;
};
