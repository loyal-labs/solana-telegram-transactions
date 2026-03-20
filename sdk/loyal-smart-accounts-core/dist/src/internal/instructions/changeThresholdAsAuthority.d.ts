import { PublicKey } from "@solana/web3.js";
export declare function changeThresholdAsAuthority({ settingsPda, settingsAuthority, rentPayer, newThreshold, memo, programId, }: {
    settingsPda: PublicKey;
    settingsAuthority: PublicKey;
    rentPayer: PublicKey;
    newThreshold: number;
    memo?: string;
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
