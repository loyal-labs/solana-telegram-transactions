import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
export declare function initializeProgramConfig({ initializer, authority, smartAccountCreationFee, treasury, programId, }: {
    initializer: PublicKey;
    authority: PublicKey;
    smartAccountCreationFee: BN | bigint | number | string;
    treasury: PublicKey;
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
