import { AccountMeta, PublicKey } from "@solana/web3.js";
import { SettingsAction } from "../generated";
export declare function executeSettingsTransactionSync({ settingsPda, signers, actions, feePayer, memo, remainingAccounts, programId, }: {
    settingsPda: PublicKey;
    signers: PublicKey[];
    actions: SettingsAction[];
    feePayer: PublicKey;
    remainingAccounts?: AccountMeta[];
    memo?: string;
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
