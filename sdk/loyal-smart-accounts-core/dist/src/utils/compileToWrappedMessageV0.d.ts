import { AddressLookupTableAccount, MessageV0, PublicKey, TransactionInstruction } from "@solana/web3.js";
export declare function compileToWrappedMessageV0({ payerKey, recentBlockhash, instructions, addressLookupTableAccounts, }: {
    payerKey: PublicKey;
    recentBlockhash: string;
    instructions: TransactionInstruction[];
    addressLookupTableAccounts?: AddressLookupTableAccount[];
}): MessageV0;
