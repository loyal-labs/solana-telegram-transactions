import { PublicKey } from "@solana/web3.js";
export declare function setNewSettingsAuthorityAsAuthority({ settingsPda, settingsAuthority, newSettingsAuthority, memo, programId, }: {
    settingsPda: PublicKey;
    settingsAuthority: PublicKey;
    newSettingsAuthority: PublicKey;
    memo?: string;
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
