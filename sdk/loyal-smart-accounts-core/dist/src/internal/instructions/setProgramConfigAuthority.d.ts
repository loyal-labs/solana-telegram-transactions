import { PublicKey } from "@solana/web3.js";
export declare function setProgramConfigAuthority({ authority, newAuthority, programId, }: {
    authority: PublicKey;
    newAuthority: PublicKey;
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
