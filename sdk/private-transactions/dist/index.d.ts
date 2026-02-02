/**
 * @loyal-labs/private-transactions - SDK for Telegram-based private transfers
 *
 * This SDK provides a simple interface for managing private SPL token deposits
 * and transfers via the telegram-private-transfer program (MagicBlock PER).
 */
export { LoyalPrivateTransactionsClient } from "./src/LoyalPrivateTransactionsClient";
export type { WalletSigner, WalletLike, Amount, SignMessage, RpcOptions, EphemeralProviderParams, EphemeralProviderResult, DepositData, UsernameDepositData, InitializeDepositParams, InitializeDepositResult, ModifyBalanceParams, ModifyBalanceResult, TransferDepositParams, TransferDepositResult, TransferToUsernameDepositParams, TransferToUsernameDepositResult, DepositForUsernameParams, DepositForUsernameResult, ClaimUsernameDepositParams, ClaimUsernameDepositResult, CreatePermissionParams, CreatePermissionResult, CreateUsernamePermissionParams, CreateUsernamePermissionResult, DelegateDepositParams, DelegateUsernameDepositParams, UndelegateDepositParams, UndelegateUsernameDepositParams, } from "./src/types";
export { isKeypair, isAnchorProvider, isWalletLike } from "./src/types";
export { PROGRAM_ID, DEPOSIT_SEED, USERNAME_DEPOSIT_SEED, VAULT_SEED, } from "./src/constants";
export { findDepositPda, findUsernameDepositPda, findVaultPda, } from "./src/pda";
export { MAGIC_PROGRAM_ID, MAGIC_CONTEXT_ID, PERMISSION_PROGRAM_ID, DELEGATION_PROGRAM_ID, permissionPdaFromAccount, getAuthToken, } from "@magicblock-labs/ephemeral-rollups-sdk";
export { IDL } from "./src/idl";
export type { TelegramPrivateTransfer } from "./src/idl";
