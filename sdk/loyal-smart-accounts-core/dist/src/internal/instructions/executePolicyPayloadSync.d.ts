import { PublicKey } from "@solana/web3.js";
import { PolicyPayload } from "../generated";
export declare function executePolicyPayloadSync({ policy, accountIndex, numSigners, policyPayload, instruction_accounts, programId, }: {
    policy: PublicKey;
    accountIndex: number;
    numSigners: number;
    policyPayload: PolicyPayload;
    instruction_accounts: {
        pubkey: PublicKey;
        isWritable: boolean;
        isSigner: boolean;
    }[];
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
