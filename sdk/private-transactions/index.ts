/**
 * @loyal-labs/private-transactions - SDK for Telegram-based private transfers
 *
 * This SDK provides a simple interface for managing private SPL token deposits
 * and transfers via the telegram-private-transfer program (MagicBlock PER).
 */

// Main SDK class
export { LoyalPrivateTransactionsClient } from "./src/LoyalPrivateTransactionsClient";

// Types
export type {
  WalletSigner,
  WalletLike,
  Amount,
  SignMessage,
  RpcOptions,
  EphemeralProviderParams,
  EphemeralProviderResult,
  DepositData,
  UsernameDepositData,
  InitializeDepositParams,
  InitializeDepositResult,
  ModifyBalanceParams,
  ModifyBalanceResult,
  TransferDepositParams,
  TransferDepositResult,
  TransferToUsernameDepositParams,
  TransferToUsernameDepositResult,
  DepositForUsernameParams,
  DepositForUsernameResult,
  ClaimUsernameDepositParams,
  ClaimUsernameDepositResult,
  CreatePermissionParams,
  CreatePermissionResult,
  CreateUsernamePermissionParams,
  CreateUsernamePermissionResult,
  DelegateDepositParams,
  DelegateUsernameDepositParams,
  UndelegateDepositParams,
  UndelegateUsernameDepositParams,
} from "./src/types";

// Type guards
export { isKeypair, isAnchorProvider, isWalletLike } from "./src/types";

// Constants
export {
  PROGRAM_ID,
  DEPOSIT_SEED,
  USERNAME_DEPOSIT_SEED,
  VAULT_SEED,
} from "./src/constants";

// PDA helpers
export {
  findDepositPda,
  findUsernameDepositPda,
  findVaultPda,
} from "./src/pda";

// MagicBlock helpers
export {
  MAGIC_PROGRAM_ID,
  MAGIC_CONTEXT_ID,
  PERMISSION_PROGRAM_ID,
  DELEGATION_PROGRAM_ID,
  permissionPdaFromAccount,
  getAuthToken,
} from "@magicblock-labs/ephemeral-rollups-sdk";

// IDL (for advanced users)
export { IDL } from "./src/idl";
export type { TelegramPrivateTransfer } from "./src/idl";
