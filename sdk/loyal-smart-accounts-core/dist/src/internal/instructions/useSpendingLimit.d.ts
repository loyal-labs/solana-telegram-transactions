import { PublicKey, TransactionInstruction } from "@solana/web3.js";
export declare function useSpendingLimit({ settingsPda, signer, spendingLimit, mint, accountIndex, amount, decimals, destination, tokenProgram, memo, programId, }: {
    settingsPda: PublicKey;
    signer: PublicKey;
    spendingLimit: PublicKey;
    /** Provide if `spendingLimit` is for an SPL token, omit if it's for SOL. */
    mint?: PublicKey;
    accountIndex: number;
    amount: number;
    decimals: number;
    destination: PublicKey;
    tokenProgram?: PublicKey;
    memo?: string;
    programId?: PublicKey;
}): TransactionInstruction;
