import { AccountMeta, PublicKey, TransactionInstruction } from "@solana/web3.js";
export declare function compileToSynchronousMessageAndAccounts({ vaultPda, members, instructions, }: {
    vaultPda: PublicKey;
    members: PublicKey[];
    instructions: TransactionInstruction[];
}): {
    instructions: Uint8Array;
    accounts: AccountMeta[];
};
