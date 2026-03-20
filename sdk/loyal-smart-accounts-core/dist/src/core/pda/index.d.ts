import { PublicKey } from "@solana/web3.js";
import { PDA_REGISTRY } from "../spec/pda-registry.js";
type ProgramIdParam = {
    programId?: PublicKey;
};
export declare function getProgramConfigPda({ programId, }: ProgramIdParam): [PublicKey, number];
export declare function getSettingsPda({ accountIndex, programId, }: ProgramIdParam & {
    accountIndex: bigint;
}): [PublicKey, number];
export declare function getSmartAccountPda({ settingsPda, accountIndex, programId, }: ProgramIdParam & {
    settingsPda: PublicKey;
    accountIndex: number;
}): [PublicKey, number];
export declare function getEphemeralSignerPda({ transactionPda, ephemeralSignerIndex, programId, }: ProgramIdParam & {
    transactionPda: PublicKey;
    ephemeralSignerIndex: number;
}): [PublicKey, number];
export declare function getTransactionPda({ settingsPda, transactionIndex, programId, }: ProgramIdParam & {
    settingsPda: PublicKey;
    transactionIndex: bigint;
}): [PublicKey, number];
export declare function getProposalPda({ settingsPda, transactionIndex, programId, }: ProgramIdParam & {
    settingsPda: PublicKey;
    transactionIndex: bigint;
}): [PublicKey, number];
export declare function getBatchTransactionPda({ settingsPda, batchIndex, transactionIndex, programId, }: ProgramIdParam & {
    settingsPda: PublicKey;
    batchIndex: bigint;
    transactionIndex: number;
}): [PublicKey, number];
export declare function getSpendingLimitPda({ settingsPda, seed, programId, }: ProgramIdParam & {
    settingsPda: PublicKey;
    seed: PublicKey;
}): [PublicKey, number];
export declare function getTransactionBufferPda({ consensusPda, creator, bufferIndex, programId, }: ProgramIdParam & {
    consensusPda: PublicKey;
    creator: PublicKey;
    bufferIndex: number;
}): [PublicKey, number];
export declare function getPolicyPda({ settingsPda, policySeed, programId, }: ProgramIdParam & {
    settingsPda: PublicKey;
    policySeed: number;
}): [PublicKey, number];
export { PDA_REGISTRY };
