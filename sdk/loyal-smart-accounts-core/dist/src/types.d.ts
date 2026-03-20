import * as beet from "@metaplex-foundation/beet";
import { PublicKey } from "@solana/web3.js";
import type { Permissions as IPermissions } from "./generated";
export { isProposalStatusActive, isProposalStatusApproved, isProposalStatusRejected, isProposalStatusCancelled, isProposalStatusExecuted, isSettingsActionAddSigner, isSettingsActionRemoveSigner, isSettingsActionChangeThreshold, isSettingsActionAddSpendingLimit, isSettingsActionRemoveSpendingLimit, isSettingsActionSetTimeLock, } from "./generated";
export type { Period, SettingsAction, SettingsActionRecord, SmartAccountSigner, } from "./generated";
export declare const Permission: {
    readonly Initiate: 1;
    readonly Vote: 2;
    readonly Execute: 4;
};
export type Permission = typeof Permission[keyof typeof Permission];
export declare class Permissions implements IPermissions {
    readonly mask: number;
    private constructor();
    static fromPermissions(permissions: Permission[]): Permissions;
    static all(): Permissions;
    static has(permissions: IPermissions, permission: Permission): boolean;
}
/**
 * De/Serializes a small array with configurable length prefix and a specific number of elements of type {@link T}
 * which do not all have the same size.
 *
 * @template T type of elements held in the array
 *
 * @param lengthBeet the De/Serializer for the array length prefix
 * @param elements the De/Serializers for the element types
 * @param elementsByteSize size of all elements in the array combined
 *
 * The implementation is minor modification of `fixedSizeArray` where the length is encoded as `lengthBeet.byteSize` bytes:
 * https://github.dev/metaplex-foundation/beet/blob/e053b7b5b0c46ce7f6906ecd38be9fd85d6e5254/beet/src/beets/collections.ts#L84
 */
export declare function fixedSizeSmallArray<T, V = Partial<T>>(lengthBeet: beet.FixedSizeBeet<number>, elements: beet.FixedSizeBeet<T, V>[], elementsByteSize: number): beet.FixedSizeBeet<T[], V[]>;
/**
 * Wraps a small array De/Serializer with configurable length prefix and elements of type {@link T}
 * which do not all have the same size.
 *
 * @template T type of elements held in the array
 *
 * @param lengthBeet the De/Serializer for the array length prefix
 * @param element the De/Serializer for the element types
 *
 * The implementation is minor modification of `array` where the length is encoded as `lengthBeet.byteSize` bytes:
 * https://github.dev/metaplex-foundation/beet/blob/e053b7b5b0c46ce7f6906ecd38be9fd85d6e5254/beet/src/beets/collections.ts#L137
 */
export declare function smallArray<T, V = Partial<T>>(lengthBeet: beet.FixedSizeBeet<number>, element: beet.Beet<T, V>): beet.FixableBeet<T[], V[]>;
export type CompiledMsInstruction = {
    programIdIndex: number;
    accountIndexes: number[];
    data: number[];
};
export declare const compiledMsInstructionBeet: beet.FixableBeetArgsStruct<CompiledMsInstruction>;
export type MessageAddressTableLookup = {
    /** Address lookup table account key */
    accountKey: PublicKey;
    /** List of indexes used to load writable account addresses */
    writableIndexes: number[];
    /** List of indexes used to load readonly account addresses */
    readonlyIndexes: number[];
};
export declare const messageAddressTableLookupBeet: beet.FixableBeetArgsStruct<MessageAddressTableLookup>;
export type TransactionMessage = {
    numSigners: number;
    numWritableSigners: number;
    numWritableNonSigners: number;
    accountKeys: PublicKey[];
    instructions: CompiledMsInstruction[];
    addressTableLookups: MessageAddressTableLookup[];
};
export declare const transactionMessageBeet: beet.FixableBeetArgsStruct<TransactionMessage>;
