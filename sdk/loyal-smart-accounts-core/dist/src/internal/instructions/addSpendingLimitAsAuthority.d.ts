import { PublicKey } from "@solana/web3.js";
import { Period } from "../generated";
export declare function addSpendingLimitAsAuthority({ settingsPda, settingsAuthority, spendingLimit, rentPayer, seed, accountIndex, mint, amount, period, signers, destinations, expiration, memo, programId, }: {
    settingsPda: PublicKey;
    settingsAuthority: PublicKey;
    spendingLimit: PublicKey;
    rentPayer: PublicKey;
    seed: PublicKey;
    accountIndex: number;
    mint: PublicKey;
    amount: bigint;
    period: Period;
    signers: PublicKey[];
    destinations: PublicKey[];
    expiration?: number;
    memo?: string;
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
