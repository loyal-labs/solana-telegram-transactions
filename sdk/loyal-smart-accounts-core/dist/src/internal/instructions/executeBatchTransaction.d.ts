import { AddressLookupTableAccount, Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
export declare function executeBatchTransaction({ connection, settingsPda, signer, batchIndex, transactionIndex, programId, }: {
    connection: Connection;
    settingsPda: PublicKey;
    signer: PublicKey;
    batchIndex: bigint;
    transactionIndex: number;
    programId?: PublicKey;
}): Promise<{
    instruction: TransactionInstruction;
    lookupTableAccounts: AddressLookupTableAccount[];
}>;
