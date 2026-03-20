import { AccountKeysFromLookups, AddressLookupTableAccount, MessageAddressTableLookup, MessageHeader, PublicKey, TransactionInstruction } from "@solana/web3.js";
export type CompiledKeyMeta = {
    isSigner: boolean;
    isWritable: boolean;
    isInvoked: boolean;
};
type KeyMetaMap = Map<string, CompiledKeyMeta>;
/**
 *  This is almost completely copy-pasted from solana-web3.js and slightly adapted to work with "wrapped" transaction messaged such as in VaultTransaction.
 *  @see https://github.com/solana-labs/solana-web3.js/blob/87d33ac68e2453b8a01cf8c425aa7623888434e8/packages/library-legacy/src/message/compiled-keys.ts
 */
export declare class CompiledKeys {
    payer?: PublicKey;
    keyMetaMap: KeyMetaMap;
    constructor(payer: PublicKey | undefined, keyMetaMap: KeyMetaMap);
    /**
     * The only difference between this and the original is that we don't mark the instruction programIds as invoked.
     * It makes sense to do because the instructions will be called via CPI, so the programIds can come from Address Lookup Tables.
     * This allows to compress the message size and avoid hitting the tx size limit during vault_transaction_create instruction calls.
     */
    static compile(instructions: Array<TransactionInstruction>, payer: PublicKey): CompiledKeys;
    /**
     * Compiles instructions without a payer.
     */
    static compileWithoutPayer(instructions: Array<TransactionInstruction>): CompiledKeys;
    getMessageComponents(): [MessageHeader, Array<PublicKey>];
    extractTableLookup(lookupTable: AddressLookupTableAccount): [MessageAddressTableLookup, AccountKeysFromLookups] | undefined;
    /** @internal */
    private drainKeysFoundInLookupTable;
}
export {};
