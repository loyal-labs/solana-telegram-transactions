/**
 * @loyal-labs/private-transactions - SDK for private Solana deposits with MagicBlock PER
 *
 * This SDK provides an interface for managing private token deposits using
 * MagicBlock's Private Ephemeral Rollups (PER) for confidential transactions.
 *
 * @example
 * // Base layer client for setup operations
 * import { LoyalPrivateTransactionsClient } from '@loyal-labs/private-transactions';
 * import { Connection, Keypair } from '@solana/web3.js';
 *
 * const connection = new Connection('https://api.devnet.solana.com');
 * const client = LoyalPrivateTransactionsClient.from(connection, keypair);
 *
 * // Initialize and fund deposit
 * await client.initializeDeposit({ user, tokenMint, payer });
 * await client.modifyBalance({ user, tokenMint, amount, increase: true, ... });
 *
 * // Create permission and delegate to ephemeral rollup
 * await client.createPermission({ user, tokenMint, payer });
 * await client.delegateDeposit({ user, tokenMint, payer, validator });
 *
 * @example
 * // Ephemeral rollup client for private operations
 * const ephemeralClient = await LoyalPrivateTransactionsClient.fromEphemeral({
 *   signer: keypair,
 *   rpcEndpoint: 'http://localhost:7799',
 *   wsEndpoint: 'ws://localhost:7800',
 * });
 *
 * // Execute private transfer
 * await ephemeralClient.transferToUsernameDeposit({ username, tokenMint, amount, ... });
 *
 * // Commit and undelegate
 * await ephemeralClient.undelegateDeposit({ user, tokenMint, ... });
 */
export { LoyalPrivateTransactionsClient } from "./src/LoyalPrivateTransactionsClient";
export type { WalletSigner, WalletLike, RpcOptions, ClientConfig, DepositData, UsernameDepositData, InitializeDepositParams, ModifyBalanceParams, ModifyBalanceResult, DepositForUsernameParams, ClaimUsernameDepositParams, CreatePermissionParams, CreateUsernamePermissionParams, DelegateDepositParams, DelegateUsernameDepositParams, UndelegateDepositParams, UndelegateUsernameDepositParams, TransferDepositParams, TransferToUsernameDepositParams, DelegationRecord, DelegationStatusResult, DelegationStatusResponse, } from "./src/types";
export { isKeypair, isAnchorProvider, isWalletLike } from "./src/types";
export { ER_VALIDATOR, PROGRAM_ID, DELEGATION_PROGRAM_ID, PERMISSION_PROGRAM_ID, MAGIC_PROGRAM_ID, MAGIC_CONTEXT_ID, DEPOSIT_SEED, DEPOSIT_SEED_BYTES, USERNAME_DEPOSIT_SEED, USERNAME_DEPOSIT_SEED_BYTES, VAULT_SEED, VAULT_SEED_BYTES, PERMISSION_SEED, PERMISSION_SEED_BYTES, LAMPORTS_PER_SOL, solToLamports, lamportsToSol, } from "./src/constants";
export { findDepositPda, findUsernameDepositPda, findVaultPda, findPermissionPda, findDelegationRecordPda, findDelegationMetadataPda, findBufferPda, } from "./src/pda";
export declare const IDL: {
    address: string;
    metadata: {
        name: string;
        version: string;
        spec: string;
        description: string;
    };
    instructions: ({
        name: string;
        docs: string[];
        discriminator: number[];
        accounts: ({
            name: string;
            writable: boolean;
            pda?: undefined;
            relations?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            pda: {
                seeds: ({
                    kind: string;
                    value: number[];
                    path?: undefined;
                } | {
                    kind: string;
                    path: string;
                    value?: undefined;
                })[];
                program?: undefined;
            };
            relations?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            pda: {
                seeds: ({
                    kind: string;
                    path: string;
                    value?: undefined;
                } | {
                    kind: string;
                    value: number[];
                    path?: undefined;
                })[];
                program: {
                    kind: string;
                    value: number[];
                };
            };
            relations?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            pda: {
                seeds: ({
                    kind: string;
                    value: number[];
                    path?: undefined;
                    account?: undefined;
                } | {
                    kind: string;
                    path: string;
                    account: string;
                    value?: undefined;
                })[];
                program?: undefined;
            };
            relations?: undefined;
            address?: undefined;
        } | {
            name: string;
            relations: string[];
            writable?: undefined;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable?: undefined;
            pda?: undefined;
            relations?: undefined;
            address?: undefined;
        } | {
            name: string;
            address: string;
            writable?: undefined;
            pda?: undefined;
            relations?: undefined;
        })[];
        args: {
            name: string;
            type: string;
        }[];
    } | {
        name: string;
        discriminator: number[];
        accounts: ({
            name: string;
            relations: string[];
            writable?: undefined;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            pda: {
                seeds: ({
                    kind: string;
                    value: number[];
                    path?: undefined;
                    account?: undefined;
                } | {
                    kind: string;
                    path: string;
                    account: string;
                    value?: undefined;
                })[];
            };
            relations?: undefined;
            address?: undefined;
        } | {
            name: string;
            relations?: undefined;
            writable?: undefined;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            address: string;
            relations?: undefined;
            writable?: undefined;
            pda?: undefined;
        })[];
        args: {
            name: string;
            type: string;
        }[];
        docs?: undefined;
    } | {
        name: string;
        docs: string[];
        discriminator: number[];
        accounts: ({
            name: string;
            writable: boolean;
            signer: boolean;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            signer: boolean;
            writable?: undefined;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            pda: {
                seeds: ({
                    kind: string;
                    value: number[];
                    path?: undefined;
                    account?: undefined;
                } | {
                    kind: string;
                    path: string;
                    value?: undefined;
                    account?: undefined;
                } | {
                    kind: string;
                    path: string;
                    account: string;
                    value?: undefined;
                })[];
            };
            writable?: undefined;
            signer?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            signer?: undefined;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable?: undefined;
            signer?: undefined;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            address: string;
            writable?: undefined;
            signer?: undefined;
            pda?: undefined;
        })[];
        args: never[];
    } | {
        name: string;
        docs: string[];
        discriminator: number[];
        accounts: ({
            name: string;
            writable: boolean;
            signer: boolean;
            optional?: undefined;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            optional: boolean;
            writable?: undefined;
            signer?: undefined;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            pda: {
                seeds: ({
                    kind: string;
                    value: number[];
                    path?: undefined;
                } | {
                    kind: string;
                    path: string;
                    value?: undefined;
                })[];
                program: {
                    kind: string;
                    value: number[];
                    path?: undefined;
                };
            };
            signer?: undefined;
            optional?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            pda: {
                seeds: ({
                    kind: string;
                    value: number[];
                    path?: undefined;
                } | {
                    kind: string;
                    path: string;
                    value?: undefined;
                })[];
                program: {
                    kind: string;
                    path: string;
                    value?: undefined;
                };
            };
            signer?: undefined;
            optional?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            pda: {
                seeds: ({
                    kind: string;
                    value: number[];
                    path?: undefined;
                } | {
                    kind: string;
                    path: string;
                    value?: undefined;
                })[];
                program?: undefined;
            };
            signer?: undefined;
            optional?: undefined;
            address?: undefined;
        } | {
            name: string;
            address: string;
            writable?: undefined;
            signer?: undefined;
            optional?: undefined;
            pda?: undefined;
        })[];
        args: {
            name: string;
            type: string;
        }[];
    } | {
        name: string;
        docs: string[];
        discriminator: number[];
        accounts: ({
            name: string;
            writable: boolean;
            signer: boolean;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            pda: {
                seeds: ({
                    kind: string;
                    value: number[];
                    path?: undefined;
                } | {
                    kind: string;
                    path: string;
                    value?: undefined;
                })[];
                program?: undefined;
            };
            signer?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            pda: {
                seeds: ({
                    kind: string;
                    path: string;
                    value?: undefined;
                } | {
                    kind: string;
                    value: number[];
                    path?: undefined;
                })[];
                program: {
                    kind: string;
                    value: number[];
                };
            };
            signer?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            signer?: undefined;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable?: undefined;
            signer?: undefined;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            address: string;
            writable?: undefined;
            signer?: undefined;
            pda?: undefined;
        })[];
        args: {
            name: string;
            type: string;
        }[];
    } | {
        name: string;
        discriminator: number[];
        accounts: ({
            name: string;
            writable: boolean;
            signer: boolean;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            pda: {
                seeds: ({
                    kind: string;
                    value: number[];
                    path?: undefined;
                } | {
                    kind: string;
                    path: string;
                    value?: undefined;
                })[];
            };
            signer?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable?: undefined;
            signer?: undefined;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            address: string;
            writable?: undefined;
            signer?: undefined;
            pda?: undefined;
        })[];
        args: {
            name: string;
            type: string;
        }[];
        docs?: undefined;
    } | {
        name: string;
        docs: string[];
        discriminator: number[];
        accounts: ({
            name: string;
            writable: boolean;
            signer: boolean;
            relations?: undefined;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            signer: boolean;
            relations: string[];
            writable?: undefined;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            pda: {
                seeds: ({
                    kind: string;
                    value: number[];
                    path?: undefined;
                    account?: undefined;
                } | {
                    kind: string;
                    path: string;
                    account: string;
                    value?: undefined;
                })[];
                program?: undefined;
            };
            signer?: undefined;
            relations?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            pda: {
                seeds: ({
                    kind: string;
                    path: string;
                    value?: undefined;
                } | {
                    kind: string;
                    value: number[];
                    path?: undefined;
                })[];
                program: {
                    kind: string;
                    value: number[];
                };
            };
            signer?: undefined;
            relations?: undefined;
            address?: undefined;
        } | {
            name: string;
            relations: string[];
            writable?: undefined;
            signer?: undefined;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            address: string;
            writable?: undefined;
            signer?: undefined;
            relations?: undefined;
            pda?: undefined;
        })[];
        args: {
            name: string;
            type: {
                defined: {
                    name: string;
                };
            };
        }[];
    } | {
        name: string;
        discriminator: number[];
        accounts: ({
            name: string;
            writable: boolean;
        } | {
            name: string;
            writable?: undefined;
        })[];
        args: {
            name: string;
            type: {
                vec: string;
            };
        }[];
        docs?: undefined;
    } | {
        name: string;
        docs: string[];
        discriminator: number[];
        accounts: ({
            name: string;
            relations: string[];
            writable?: undefined;
            signer?: undefined;
            optional?: undefined;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            signer: boolean;
            relations?: undefined;
            optional?: undefined;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            optional: boolean;
            relations?: undefined;
            writable?: undefined;
            signer?: undefined;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            pda: {
                seeds: ({
                    kind: string;
                    value: number[];
                    path?: undefined;
                    account?: undefined;
                } | {
                    kind: string;
                    path: string;
                    account: string;
                    value?: undefined;
                })[];
            };
            relations?: undefined;
            signer?: undefined;
            optional?: undefined;
            address?: undefined;
        } | {
            name: string;
            address: string;
            relations?: undefined;
            writable?: undefined;
            signer?: undefined;
            optional?: undefined;
            pda?: undefined;
        })[];
        args: {
            name: string;
            type: string;
        }[];
    } | {
        name: string;
        docs: string[];
        discriminator: number[];
        accounts: ({
            name: string;
            writable?: undefined;
            signer?: undefined;
            optional?: undefined;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            signer: boolean;
            optional?: undefined;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            optional: boolean;
            writable?: undefined;
            signer?: undefined;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            pda: {
                seeds: ({
                    kind: string;
                    value: number[];
                    path?: undefined;
                    account?: undefined;
                } | {
                    kind: string;
                    path: string;
                    value?: undefined;
                    account?: undefined;
                } | {
                    kind: string;
                    path: string;
                    account: string;
                    value?: undefined;
                })[];
            };
            signer?: undefined;
            optional?: undefined;
            address?: undefined;
        } | {
            name: string;
            address: string;
            writable?: undefined;
            signer?: undefined;
            optional?: undefined;
            pda?: undefined;
        } | {
            name: string;
            writable: boolean;
            address: string;
            signer?: undefined;
            optional?: undefined;
            pda?: undefined;
        })[];
        args: never[];
    } | {
        name: string;
        docs: string[];
        discriminator: number[];
        accounts: ({
            name: string;
            writable: boolean;
            signer: boolean;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable?: undefined;
            signer?: undefined;
            pda?: undefined;
            address?: undefined;
        } | {
            name: string;
            writable: boolean;
            pda: {
                seeds: ({
                    kind: string;
                    value: number[];
                    path?: undefined;
                } | {
                    kind: string;
                    path: string;
                    value?: undefined;
                })[];
            };
            signer?: undefined;
            address?: undefined;
        } | {
            name: string;
            address: string;
            writable?: undefined;
            signer?: undefined;
            pda?: undefined;
        } | {
            name: string;
            writable: boolean;
            address: string;
            signer?: undefined;
            pda?: undefined;
        })[];
        args: {
            name: string;
            type: string;
        }[];
    })[];
    accounts: {
        name: string;
        discriminator: number[];
    }[];
    errors: {
        code: number;
        name: string;
        msg: string;
    }[];
    types: ({
        name: string;
        docs: string[];
        type: {
            kind: string;
            fields: {
                name: string;
                type: string;
            }[];
        };
    } | {
        name: string;
        type: {
            kind: string;
            fields: ({
                name: string;
                type: string;
            } | {
                name: string;
                type: {
                    option: string;
                };
            })[];
        };
        docs?: undefined;
    })[];
};
export type { TelegramPrivateTransfer } from "./src/idl/telegram_private_transfer.ts";
