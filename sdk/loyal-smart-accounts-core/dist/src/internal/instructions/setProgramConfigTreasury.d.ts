import { PublicKey } from "@solana/web3.js";
export declare function setProgramConfigTreasury({ authority, treasury, programId, }: {
    authority: PublicKey;
    treasury: PublicKey;
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
