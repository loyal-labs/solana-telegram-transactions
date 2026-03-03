import { PublicKey } from "@solana/web3.js";

import loyalOracleIdl from "@/program/idl/loyal_oracle.json";

export const PROGRAM_ID = new PublicKey(loyalOracleIdl.address);
export const CONTEXT_SEED = Buffer.from("context");
export const CHAT_SEED = Buffer.from("chat");

export const IRYS_GATEWAY_BASE_URL = "https://gateway.irys.xyz";
export const LOYAL_ORACLE_BASE_URL = "localhost:3000";
