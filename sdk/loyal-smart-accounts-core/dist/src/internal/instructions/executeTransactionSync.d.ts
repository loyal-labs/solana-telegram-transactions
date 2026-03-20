import { PublicKey } from "@solana/web3.js";
export declare function executeTransactionSync({ settingsPda, accountIndex, numSigners, instructions, instruction_accounts, programId, }: {
    settingsPda: PublicKey;
    accountIndex: number;
    numSigners: number;
    instructions: Uint8Array;
    instruction_accounts: {
        pubkey: PublicKey;
        isWritable: boolean;
        isSigner: boolean;
    }[];
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
