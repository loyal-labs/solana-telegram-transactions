import { VersionedTransaction } from "@solana/web3.js";
import type { AddressLookupTableAccount, Commitment, Connection, PublicKey, SendOptions, Signer, TransactionInstruction } from "@solana/web3.js";
export type PreparedLoyalSmartAccountsOperation<Name extends string = string> = Readonly<{
    operation: Name;
    payer: PublicKey;
    programId: PublicKey;
    instructions: readonly TransactionInstruction[];
    lookupTableAccounts: readonly AddressLookupTableAccount[];
}>;
export type LoyalSmartAccountsConfirmationContext = {
    prepared: PreparedLoyalSmartAccountsOperation<string>;
    blockhash: string;
    lastValidBlockHeight: number;
    commitment?: Commitment;
};
export type LoyalSmartAccountsSendPreparedContext = {
    blockhash: string;
    lastValidBlockHeight: number;
    commitment?: Commitment;
    sendOptions?: SendOptions;
    compileUnsignedTransaction: () => VersionedTransaction;
};
export type LoyalSmartAccountsSendPreparedFn = (prepared: PreparedLoyalSmartAccountsOperation<string>, signers: readonly Signer[], context: LoyalSmartAccountsSendPreparedContext) => Promise<string>;
export type LoyalSmartAccountsConfirmFn = (signature: string, context: LoyalSmartAccountsConfirmationContext) => Promise<void>;
export type LoyalSmartAccountsClientConfig = {
    connection: Connection;
    programId?: PublicKey;
    defaultCommitment?: Commitment;
    sendPrepared?: LoyalSmartAccountsSendPreparedFn;
    confirm?: LoyalSmartAccountsConfirmFn;
};
export type LoyalSmartAccountsTransport = {
    connection: Connection;
    programId: PublicKey;
    defaultCommitment?: Commitment;
    sendPrepared?: LoyalSmartAccountsSendPreparedFn;
    confirm?: LoyalSmartAccountsConfirmFn;
};
export type LoyalSmartAccountsSendOptions = SendOptions;
export declare function createTransport(config: LoyalSmartAccountsClientConfig): LoyalSmartAccountsTransport;
export declare function freezePreparedOperation<Name extends string>(operation: PreparedLoyalSmartAccountsOperation<Name>): PreparedLoyalSmartAccountsOperation<Name>;
export declare function compilePreparedOperation(args: {
    prepared: PreparedLoyalSmartAccountsOperation<string>;
    blockhash: string;
}): VersionedTransaction;
export declare function sendPreparedOperation(args: {
    transport: LoyalSmartAccountsTransport;
    prepared: PreparedLoyalSmartAccountsOperation<string>;
    signers: Signer[];
    sendOptions?: LoyalSmartAccountsSendOptions;
}): Promise<string>;
