import { PublicKey } from "@solana/web3.js";
export declare function setArchivalAuthorityAsAuthority({ settingsPda, settingsAuthority, newArchivalAuthority, memo, programId, }: {
    settingsPda: PublicKey;
    settingsAuthority: PublicKey;
    newArchivalAuthority: PublicKey | null;
    memo?: string;
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
