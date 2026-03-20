import { PublicKey } from "@solana/web3.js";
import invariant from "invariant";
import { PROGRAM_ID } from "../generated/index.js";
import { PDA_REGISTRY } from "../spec/pda-registry.js";
import {
  toU128Bytes,
  toU32Bytes,
  toU64Bytes,
  toU8Bytes,
  toUtfBytes,
} from "../codecs/primitives.js";

type ProgramIdParam = { programId?: PublicKey };

const STATIC_SEED_CACHE = new Map<string, Uint8Array>();

function getStaticSeed(value: string): Uint8Array {
  const cached = STATIC_SEED_CACHE.get(value);
  if (cached) {
    return cached;
  }
  const seed = toUtfBytes(value);
  STATIC_SEED_CACHE.set(value, seed);
  return seed;
}

function derivePda(seeds: Uint8Array[], programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(seeds, programId);
}

export function getProgramConfigPda({
  programId = PROGRAM_ID,
}: ProgramIdParam): [PublicKey, number] {
  return derivePda(
    PDA_REGISTRY.programConfig.seeds.map((seed) => getStaticSeed(seed)),
    programId
  );
}

export function getSettingsPda({
  accountIndex,
  programId = PROGRAM_ID,
}: ProgramIdParam & { accountIndex: bigint }): [PublicKey, number] {
  return derivePda(
    [getStaticSeed("smart_account"), getStaticSeed("settings"), toU128Bytes(accountIndex)],
    programId
  );
}

export function getSmartAccountPda({
  settingsPda,
  accountIndex,
  programId = PROGRAM_ID,
}: ProgramIdParam & {
  settingsPda: PublicKey;
  accountIndex: number;
}): [PublicKey, number] {
  invariant(accountIndex >= 0 && accountIndex < 256, "Invalid vault index");
  return derivePda(
    [
      getStaticSeed("smart_account"),
      settingsPda.toBytes(),
      getStaticSeed("smart_account"),
      toU8Bytes(accountIndex),
    ],
    programId
  );
}

export function getEphemeralSignerPda({
  transactionPda,
  ephemeralSignerIndex,
  programId = PROGRAM_ID,
}: ProgramIdParam & {
  transactionPda: PublicKey;
  ephemeralSignerIndex: number;
}): [PublicKey, number] {
  return derivePda(
    [
      getStaticSeed("smart_account"),
      transactionPda.toBytes(),
      getStaticSeed("ephemeral_signer"),
      toU8Bytes(ephemeralSignerIndex),
    ],
    programId
  );
}

export function getTransactionPda({
  settingsPda,
  transactionIndex,
  programId = PROGRAM_ID,
}: ProgramIdParam & {
  settingsPda: PublicKey;
  transactionIndex: bigint;
}): [PublicKey, number] {
  return derivePda(
    [
      getStaticSeed("smart_account"),
      settingsPda.toBytes(),
      getStaticSeed("transaction"),
      toU64Bytes(transactionIndex),
    ],
    programId
  );
}

export function getProposalPda({
  settingsPda,
  transactionIndex,
  programId = PROGRAM_ID,
}: ProgramIdParam & {
  settingsPda: PublicKey;
  transactionIndex: bigint;
}): [PublicKey, number] {
  return derivePda(
    [
      getStaticSeed("smart_account"),
      settingsPda.toBytes(),
      getStaticSeed("transaction"),
      toU64Bytes(transactionIndex),
      getStaticSeed("proposal"),
    ],
    programId
  );
}

export function getBatchTransactionPda({
  settingsPda,
  batchIndex,
  transactionIndex,
  programId = PROGRAM_ID,
}: ProgramIdParam & {
  settingsPda: PublicKey;
  batchIndex: bigint;
  transactionIndex: number;
}): [PublicKey, number] {
  return derivePda(
    [
      getStaticSeed("smart_account"),
      settingsPda.toBytes(),
      getStaticSeed("transaction"),
      toU64Bytes(batchIndex),
      getStaticSeed("batch_transaction"),
      toU32Bytes(transactionIndex),
    ],
    programId
  );
}

export function getSpendingLimitPda({
  settingsPda,
  seed,
  programId = PROGRAM_ID,
}: ProgramIdParam & {
  settingsPda: PublicKey;
  seed: PublicKey;
}): [PublicKey, number] {
  return derivePda(
    [
      getStaticSeed("smart_account"),
      settingsPda.toBytes(),
      getStaticSeed("spending_limit"),
      seed.toBytes(),
    ],
    programId
  );
}

export function getTransactionBufferPda({
  consensusPda,
  creator,
  bufferIndex,
  programId = PROGRAM_ID,
}: ProgramIdParam & {
  consensusPda: PublicKey;
  creator: PublicKey;
  bufferIndex: number;
}): [PublicKey, number] {
  return derivePda(
    [
      getStaticSeed("smart_account"),
      consensusPda.toBytes(),
      getStaticSeed("transaction_buffer"),
      creator.toBytes(),
      toU8Bytes(bufferIndex),
    ],
    programId
  );
}

export function getPolicyPda({
  settingsPda,
  policySeed,
  programId = PROGRAM_ID,
}: ProgramIdParam & {
  settingsPda: PublicKey;
  policySeed: number;
}): [PublicKey, number] {
  return derivePda(
    [
      getStaticSeed("smart_account"),
      getStaticSeed("policy"),
      settingsPda.toBytes(),
      toU64Bytes(BigInt(policySeed)),
    ],
    programId
  );
}

export { PDA_REGISTRY };
