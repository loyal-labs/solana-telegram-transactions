import { type bignum } from "@metaplex-foundation/beet";
export declare function toUtfBytes(str: string): Uint8Array;
export declare function toU8Bytes(num: number): Uint8Array;
export declare function toU32Bytes(num: number): Uint8Array;
export declare function toU64Bytes(num: bigint): Uint8Array;
export declare function toU128Bytes(num: bigint): Uint8Array;
export declare function toBigInt(number: bignum): bigint;
