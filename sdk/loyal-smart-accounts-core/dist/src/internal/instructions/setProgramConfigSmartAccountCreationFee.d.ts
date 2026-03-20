import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
export declare function setProgramConfigSmartAccountCreationFee({ authority, smartAccountCreationFee, programId, }: {
    authority: PublicKey;
    smartAccountCreationFee: BN | bigint | number | string;
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
