import { AccountMeta, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { SmartAccountSigner } from "../generated";
export declare function createSmartAccount({ treasury, creator, settings, settingsAuthority, threshold, signers, timeLock, rentCollector, memo, programId, remainingAccounts, }: {
    treasury: PublicKey;
    creator: PublicKey;
    settings?: PublicKey;
    settingsAuthority: PublicKey | null;
    threshold: number;
    signers: SmartAccountSigner[];
    timeLock: number;
    rentCollector: PublicKey | null;
    memo?: string;
    programId?: PublicKey;
    remainingAccounts?: AccountMeta[];
}): TransactionInstruction;
