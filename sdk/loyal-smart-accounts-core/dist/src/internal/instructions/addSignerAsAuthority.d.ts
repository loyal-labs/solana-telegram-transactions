import { PublicKey } from "@solana/web3.js";
import { SmartAccountSigner } from "../generated";
export declare function addSignerAsAuthority({ settingsPda, settingsAuthority, rentPayer, newSigner, memo, programId, }: {
    settingsPda: PublicKey;
    settingsAuthority: PublicKey;
    rentPayer: PublicKey;
    newSigner: SmartAccountSigner;
    memo?: string;
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
