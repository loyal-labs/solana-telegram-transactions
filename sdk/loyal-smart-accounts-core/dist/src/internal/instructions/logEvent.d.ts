import { PublicKey } from "@solana/web3.js";
export declare function logEvent({ logAuthority, event, programId, }: {
    logAuthority: PublicKey;
    event: Uint8Array;
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
