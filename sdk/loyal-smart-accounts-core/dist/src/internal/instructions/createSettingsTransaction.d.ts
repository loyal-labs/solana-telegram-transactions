import { AccountMeta, PublicKey } from "@solana/web3.js";
import { SettingsAction } from "../generated";
export declare function createSettingsTransaction({ settingsPda, transactionIndex, creator, rentPayer, actions, memo, remainingAccounts, programId, }: {
    settingsPda: PublicKey;
    /** Member of the multisig that is creating the transaction. */
    creator: PublicKey;
    /** Payer for the transaction account rent. If not provided, `creator` is used. */
    rentPayer?: PublicKey;
    transactionIndex: bigint;
    actions: SettingsAction[];
    memo?: string;
    remainingAccounts?: AccountMeta[];
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
