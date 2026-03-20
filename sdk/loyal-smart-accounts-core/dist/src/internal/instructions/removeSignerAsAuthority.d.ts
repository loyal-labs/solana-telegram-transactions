import { PublicKey } from "@solana/web3.js";
export declare function removeSignerAsAuthority({ settingsPda, settingsAuthority, oldSigner, memo, programId, }: {
    settingsPda: PublicKey;
    settingsAuthority: PublicKey;
    oldSigner: PublicKey;
    memo?: string;
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
