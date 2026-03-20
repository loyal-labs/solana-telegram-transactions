import { AddressLookupTableAccount, Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
export declare function executeTransaction({ connection, settingsPda, transactionIndex, signer, programId, }: {
    connection: Connection;
    settingsPda: PublicKey;
    transactionIndex: bigint;
    signer: PublicKey;
    programId?: PublicKey;
}): Promise<{
    instruction: TransactionInstruction;
    lookupTableAccounts: AddressLookupTableAccount[];
}>;
