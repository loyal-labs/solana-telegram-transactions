import { AccountMeta, PublicKey, TransactionInstruction } from "@solana/web3.js";
export declare function compileToSynchronousMessageAndAccountsV2({ vaultPda, members, instructions, }: {
    vaultPda: PublicKey;
    members: PublicKey[];
    instructions: TransactionInstruction[];
}): {
    instructions: Uint8Array;
    accounts: AccountMeta[];
};
export declare function compileToSynchronousMessageAndAccountsV2WithHooks({ vaultPda, members, preHookAccounts, postHookAccounts, instructions, }: {
    vaultPda: PublicKey;
    members: PublicKey[];
    preHookAccounts: AccountMeta[];
    postHookAccounts: AccountMeta[];
    instructions: TransactionInstruction[];
}): {
    instructions: Uint8Array;
    accounts: AccountMeta[];
};
