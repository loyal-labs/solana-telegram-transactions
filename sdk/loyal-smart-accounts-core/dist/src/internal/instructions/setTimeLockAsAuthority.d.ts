import { PublicKey } from "@solana/web3.js";
export declare function setTimeLockAsAuthority({ settingsPda, settingsAuthority, timeLock, memo, programId, }: {
    settingsPda: PublicKey;
    settingsAuthority: PublicKey;
    timeLock: number;
    memo?: string;
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
