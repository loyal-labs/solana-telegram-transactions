import { PublicKey, TransactionInstruction, AccountMeta } from "@solana/web3.js";
export declare function executePolicyTransaction({ policy, transactionIndex, signer, anchorRemainingAccounts, programId, }: {
    policy: PublicKey;
    transactionIndex: bigint;
    signer: PublicKey;
    anchorRemainingAccounts: AccountMeta[];
    programId?: PublicKey;
}): TransactionInstruction;
