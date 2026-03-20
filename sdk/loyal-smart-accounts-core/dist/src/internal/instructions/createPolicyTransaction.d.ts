import { PolicyPayload } from "../generated";
import { PublicKey } from "@solana/web3.js";
export declare function createPolicyTransaction({ policy, transactionIndex, creator, rentPayer, accountIndex, policyPayload, programId, }: {
    policy: PublicKey;
    transactionIndex: bigint;
    creator: PublicKey;
    rentPayer?: PublicKey;
    accountIndex: number;
    policyPayload: PolicyPayload;
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
