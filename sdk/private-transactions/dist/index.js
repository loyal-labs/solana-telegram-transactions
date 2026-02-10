// src/LoyalPrivateTransactionsClient.ts
import {
  Connection,
  SystemProgram,
  VersionedTransaction as VersionedTransaction2,
  sendAndConfirmRawTransaction
} from "@solana/web3.js";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token";

// src/idl.ts
var IDL = {
  address: "97FzQdWi26mFNR21AbQNg4KqofiCLqQydQfAvRQMcXhV",
  metadata: {
    name: "telegramPrivateTransfer",
    version: "0.1.0",
    spec: "0.1.0",
    description: "Created with Anchor"
  },
  instructions: [
    {
      name: "claimUsernameDeposit",
      docs: [
        "Claims tokens from a username-based deposit using a verified Telegram session."
      ],
      discriminator: [73, 62, 148, 70, 186, 247, 37, 80],
      accounts: [
        {
          name: "recipientTokenAccount",
          writable: true
        },
        {
          name: "vault",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [118, 97, 117, 108, 116]
              },
              {
                kind: "account",
                path: "tokenMint"
              }
            ]
          }
        },
        {
          name: "vaultTokenAccount",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "vault"
              },
              {
                kind: "const",
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                kind: "account",
                path: "tokenMint"
              }
            ],
            program: {
              kind: "const",
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: "deposit",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  117,
                  115,
                  101,
                  114,
                  110,
                  97,
                  109,
                  101,
                  95,
                  100,
                  101,
                  112,
                  111,
                  115,
                  105,
                  116
                ]
              },
              {
                kind: "account",
                path: "deposit.username",
                account: "usernameDeposit"
              },
              {
                kind: "account",
                path: "deposit.tokenMint",
                account: "usernameDeposit"
              }
            ]
          }
        },
        {
          name: "tokenMint",
          relations: ["deposit"]
        },
        {
          name: "session"
        },
        {
          name: "tokenProgram",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      args: [
        {
          name: "amount",
          type: "u64"
        }
      ]
    },
    {
      name: "createPermission",
      docs: [
        "Creates a permission for a deposit account using the external permission program.",
        "",
        "Calls out to the permission program to create a permission for the deposit account."
      ],
      discriminator: [190, 182, 26, 164, 156, 221, 8, 0],
      accounts: [
        {
          name: "payer",
          writable: true,
          signer: true
        },
        {
          name: "user",
          signer: true
        },
        {
          name: "deposit",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [100, 101, 112, 111, 115, 105, 116]
              },
              {
                kind: "account",
                path: "user"
              },
              {
                kind: "account",
                path: "deposit.tokenMint",
                account: "deposit"
              }
            ]
          }
        },
        {
          name: "permission",
          writable: true
        },
        {
          name: "permissionProgram"
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111"
        }
      ],
      args: []
    },
    {
      name: "createUsernamePermission",
      docs: ["Creates a permission for a username-based deposit account."],
      discriminator: [130, 137, 147, 121, 57, 217, 102, 40],
      accounts: [
        {
          name: "payer",
          writable: true,
          signer: true
        },
        {
          name: "authority",
          signer: true
        },
        {
          name: "deposit",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  117,
                  115,
                  101,
                  114,
                  110,
                  97,
                  109,
                  101,
                  95,
                  100,
                  101,
                  112,
                  111,
                  115,
                  105,
                  116
                ]
              },
              {
                kind: "account",
                path: "deposit.username",
                account: "usernameDeposit"
              },
              {
                kind: "account",
                path: "deposit.tokenMint",
                account: "usernameDeposit"
              }
            ]
          }
        },
        {
          name: "session"
        },
        {
          name: "permission",
          writable: true
        },
        {
          name: "permissionProgram"
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111"
        }
      ],
      args: []
    },
    {
      name: "delegate",
      docs: [
        "Delegates the deposit account to the ephemeral rollups delegate program.",
        "",
        "Uses the ephemeral rollups delegate CPI to delegate the deposit account."
      ],
      discriminator: [90, 147, 75, 178, 85, 88, 4, 137],
      accounts: [
        {
          name: "payer",
          writable: true,
          signer: true
        },
        {
          name: "validator",
          optional: true
        },
        {
          name: "bufferDeposit",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [98, 117, 102, 102, 101, 114]
              },
              {
                kind: "account",
                path: "deposit"
              }
            ],
            program: {
              kind: "const",
              value: [
                120,
                119,
                237,
                228,
                109,
                110,
                60,
                47,
                140,
                61,
                153,
                86,
                183,
                54,
                59,
                48,
                46,
                44,
                189,
                35,
                126,
                97,
                173,
                95,
                156,
                209,
                177,
                123,
                98,
                164,
                128,
                252
              ]
            }
          }
        },
        {
          name: "delegationRecordDeposit",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [100, 101, 108, 101, 103, 97, 116, 105, 111, 110]
              },
              {
                kind: "account",
                path: "deposit"
              }
            ],
            program: {
              kind: "account",
              path: "delegationProgram"
            }
          }
        },
        {
          name: "delegationMetadataDeposit",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                kind: "account",
                path: "deposit"
              }
            ],
            program: {
              kind: "account",
              path: "delegationProgram"
            }
          }
        },
        {
          name: "deposit",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [100, 101, 112, 111, 115, 105, 116]
              },
              {
                kind: "arg",
                path: "user"
              },
              {
                kind: "arg",
                path: "tokenMint"
              }
            ]
          }
        },
        {
          name: "ownerProgram",
          address: "97FzQdWi26mFNR21AbQNg4KqofiCLqQydQfAvRQMcXhV"
        },
        {
          name: "delegationProgram",
          address: "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111"
        }
      ],
      args: [
        {
          name: "user",
          type: "pubkey"
        },
        {
          name: "tokenMint",
          type: "pubkey"
        }
      ]
    },
    {
      name: "delegateUsernameDeposit",
      docs: [
        "Delegates the username-based deposit account to the ephemeral rollups delegate program."
      ],
      discriminator: [26, 82, 4, 176, 221, 64, 84, 178],
      accounts: [
        {
          name: "payer",
          writable: true,
          signer: true
        },
        {
          name: "validator",
          optional: true
        },
        {
          name: "session"
        },
        {
          name: "bufferDeposit",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [98, 117, 102, 102, 101, 114]
              },
              {
                kind: "account",
                path: "deposit"
              }
            ],
            program: {
              kind: "const",
              value: [
                120,
                119,
                237,
                228,
                109,
                110,
                60,
                47,
                140,
                61,
                153,
                86,
                183,
                54,
                59,
                48,
                46,
                44,
                189,
                35,
                126,
                97,
                173,
                95,
                156,
                209,
                177,
                123,
                98,
                164,
                128,
                252
              ]
            }
          }
        },
        {
          name: "delegationRecordDeposit",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [100, 101, 108, 101, 103, 97, 116, 105, 111, 110]
              },
              {
                kind: "account",
                path: "deposit"
              }
            ],
            program: {
              kind: "account",
              path: "delegationProgram"
            }
          }
        },
        {
          name: "delegationMetadataDeposit",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                kind: "account",
                path: "deposit"
              }
            ],
            program: {
              kind: "account",
              path: "delegationProgram"
            }
          }
        },
        {
          name: "deposit",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  117,
                  115,
                  101,
                  114,
                  110,
                  97,
                  109,
                  101,
                  95,
                  100,
                  101,
                  112,
                  111,
                  115,
                  105,
                  116
                ]
              },
              {
                kind: "arg",
                path: "username"
              },
              {
                kind: "arg",
                path: "tokenMint"
              }
            ]
          }
        },
        {
          name: "ownerProgram",
          address: "97FzQdWi26mFNR21AbQNg4KqofiCLqQydQfAvRQMcXhV"
        },
        {
          name: "delegationProgram",
          address: "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111"
        }
      ],
      args: [
        {
          name: "username",
          type: "string"
        },
        {
          name: "tokenMint",
          type: "pubkey"
        }
      ]
    },
    {
      name: "depositForUsername",
      docs: [
        "Deposits tokens into a username-based deposit.",
        "",
        "Anyone can deposit tokens for a Telegram username."
      ],
      discriminator: [85, 11, 120, 21, 51, 229, 125, 220],
      accounts: [
        {
          name: "payer",
          writable: true,
          signer: true
        },
        {
          name: "depositor",
          writable: true,
          signer: true
        },
        {
          name: "deposit",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  117,
                  115,
                  101,
                  114,
                  110,
                  97,
                  109,
                  101,
                  95,
                  100,
                  101,
                  112,
                  111,
                  115,
                  105,
                  116
                ]
              },
              {
                kind: "arg",
                path: "username"
              },
              {
                kind: "account",
                path: "tokenMint"
              }
            ]
          }
        },
        {
          name: "vault",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [118, 97, 117, 108, 116]
              },
              {
                kind: "account",
                path: "tokenMint"
              }
            ]
          }
        },
        {
          name: "vaultTokenAccount",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "vault"
              },
              {
                kind: "const",
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                kind: "account",
                path: "tokenMint"
              }
            ],
            program: {
              kind: "const",
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: "depositorTokenAccount",
          writable: true
        },
        {
          name: "tokenMint"
        },
        {
          name: "tokenProgram",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          name: "associatedTokenProgram",
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111"
        }
      ],
      args: [
        {
          name: "username",
          type: "string"
        },
        {
          name: "amount",
          type: "u64"
        }
      ]
    },
    {
      name: "initializeDeposit",
      docs: [
        "Initializes a deposit account for a user and token mint if it does not exist.",
        "",
        "Sets up a new deposit account with zero balance for the user and token mint.",
        "If the account is already initialized, this instruction is a no-op."
      ],
      discriminator: [171, 65, 93, 225, 61, 109, 31, 227],
      accounts: [
        {
          name: "payer",
          writable: true,
          signer: true
        },
        {
          name: "user"
        },
        {
          name: "deposit",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [100, 101, 112, 111, 115, 105, 116]
              },
              {
                kind: "account",
                path: "user"
              },
              {
                kind: "account",
                path: "tokenMint"
              }
            ]
          }
        },
        {
          name: "tokenMint"
        },
        {
          name: "tokenProgram",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111"
        }
      ],
      args: []
    },
    {
      name: "modifyBalance",
      docs: [
        "Modifies the balance of a user's deposit account by transferring tokens in or out.",
        "",
        "If `args.increase` is true, tokens are transferred from the user's token account to the deposit account.",
        "If false, tokens are transferred from the deposit account back to the user's token account."
      ],
      discriminator: [148, 232, 7, 240, 55, 51, 121, 115],
      accounts: [
        {
          name: "payer",
          writable: true,
          signer: true
        },
        {
          name: "user",
          signer: true,
          relations: ["deposit"]
        },
        {
          name: "vault",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [118, 97, 117, 108, 116]
              },
              {
                kind: "account",
                path: "deposit.tokenMint",
                account: "deposit"
              }
            ]
          }
        },
        {
          name: "deposit",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [100, 101, 112, 111, 115, 105, 116]
              },
              {
                kind: "account",
                path: "deposit.user",
                account: "deposit"
              },
              {
                kind: "account",
                path: "deposit.tokenMint",
                account: "deposit"
              }
            ]
          }
        },
        {
          name: "userTokenAccount",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "user"
              },
              {
                kind: "const",
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                kind: "account",
                path: "tokenMint"
              }
            ],
            program: {
              kind: "const",
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: "vaultTokenAccount",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "vault"
              },
              {
                kind: "const",
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                kind: "account",
                path: "tokenMint"
              }
            ],
            program: {
              kind: "const",
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: "tokenMint",
          relations: ["deposit"]
        },
        {
          name: "tokenProgram",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          name: "associatedTokenProgram",
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111"
        }
      ],
      args: [
        {
          name: "args",
          type: {
            defined: {
              name: "modifyDepositArgs"
            }
          }
        }
      ]
    },
    {
      name: "processUndelegation",
      discriminator: [196, 28, 41, 206, 48, 37, 51, 167],
      accounts: [
        {
          name: "baseAccount",
          writable: true
        },
        {
          name: "buffer"
        },
        {
          name: "payer",
          writable: true
        },
        {
          name: "systemProgram"
        }
      ],
      args: [
        {
          name: "accountSeeds",
          type: {
            vec: "bytes"
          }
        }
      ]
    },
    {
      name: "transferDeposit",
      docs: [
        "Transfers a specified amount from one user's deposit account to another's for the same token mint.",
        "",
        "Only updates the internal accounting; does not move actual tokens."
      ],
      discriminator: [20, 20, 147, 223, 41, 63, 204, 111],
      accounts: [
        {
          name: "user",
          relations: ["sourceDeposit"]
        },
        {
          name: "payer",
          writable: true,
          signer: true
        },
        {
          name: "sessionToken",
          optional: true
        },
        {
          name: "sourceDeposit",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [100, 101, 112, 111, 115, 105, 116]
              },
              {
                kind: "account",
                path: "sourceDeposit.user",
                account: "deposit"
              },
              {
                kind: "account",
                path: "sourceDeposit.tokenMint",
                account: "deposit"
              }
            ]
          }
        },
        {
          name: "destinationDeposit",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [100, 101, 112, 111, 115, 105, 116]
              },
              {
                kind: "account",
                path: "destinationDeposit.user",
                account: "deposit"
              },
              {
                kind: "account",
                path: "destinationDeposit.tokenMint",
                account: "deposit"
              }
            ]
          }
        },
        {
          name: "tokenMint",
          relations: ["sourceDeposit", "destinationDeposit"]
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111"
        }
      ],
      args: [
        {
          name: "amount",
          type: "u64"
        }
      ]
    },
    {
      name: "transferToUsernameDeposit",
      docs: [
        "Transfers a specified amount from a user's deposit account to a username-based deposit.",
        "",
        "Only updates the internal accounting; does not move actual tokens."
      ],
      discriminator: [224, 228, 188, 234, 232, 153, 75, 96],
      accounts: [
        {
          name: "user",
          relations: ["sourceDeposit"]
        },
        {
          name: "payer",
          writable: true,
          signer: true
        },
        {
          name: "sessionToken",
          optional: true
        },
        {
          name: "sourceDeposit",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [100, 101, 112, 111, 115, 105, 116]
              },
              {
                kind: "account",
                path: "sourceDeposit.user",
                account: "deposit"
              },
              {
                kind: "account",
                path: "sourceDeposit.tokenMint",
                account: "deposit"
              }
            ]
          }
        },
        {
          name: "destinationDeposit",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  117,
                  115,
                  101,
                  114,
                  110,
                  97,
                  109,
                  101,
                  95,
                  100,
                  101,
                  112,
                  111,
                  115,
                  105,
                  116
                ]
              },
              {
                kind: "account",
                path: "destinationDeposit.username",
                account: "usernameDeposit"
              },
              {
                kind: "account",
                path: "destinationDeposit.tokenMint",
                account: "usernameDeposit"
              }
            ]
          }
        },
        {
          name: "tokenMint",
          relations: ["sourceDeposit", "destinationDeposit"]
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111"
        }
      ],
      args: [
        {
          name: "amount",
          type: "u64"
        }
      ]
    },
    {
      name: "undelegate",
      docs: [
        "Commits and undelegates the deposit account from the ephemeral rollups program.",
        "",
        "Uses the ephemeral rollups SDK to commit and undelegate the deposit account."
      ],
      discriminator: [131, 148, 180, 198, 91, 104, 42, 238],
      accounts: [
        {
          name: "user"
        },
        {
          name: "payer",
          writable: true,
          signer: true
        },
        {
          name: "sessionToken",
          optional: true
        },
        {
          name: "deposit",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [100, 101, 112, 111, 115, 105, 116]
              },
              {
                kind: "account",
                path: "user"
              },
              {
                kind: "account",
                path: "deposit.tokenMint",
                account: "deposit"
              }
            ]
          }
        },
        {
          name: "magicProgram",
          address: "Magic11111111111111111111111111111111111111"
        },
        {
          name: "magicContext",
          writable: true,
          address: "MagicContext1111111111111111111111111111111"
        }
      ],
      args: []
    },
    {
      name: "undelegateUsernameDeposit",
      docs: [
        "Commits and undelegates the username-based deposit account from the ephemeral rollups program."
      ],
      discriminator: [169, 131, 184, 97, 218, 190, 134, 4],
      accounts: [
        {
          name: "payer",
          writable: true,
          signer: true
        },
        {
          name: "session"
        },
        {
          name: "deposit",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  117,
                  115,
                  101,
                  114,
                  110,
                  97,
                  109,
                  101,
                  95,
                  100,
                  101,
                  112,
                  111,
                  115,
                  105,
                  116
                ]
              },
              {
                kind: "arg",
                path: "username"
              },
              {
                kind: "arg",
                path: "tokenMint"
              }
            ]
          }
        },
        {
          name: "magicProgram",
          address: "Magic11111111111111111111111111111111111111"
        },
        {
          name: "magicContext",
          writable: true,
          address: "MagicContext1111111111111111111111111111111"
        }
      ],
      args: [
        {
          name: "username",
          type: "string"
        },
        {
          name: "tokenMint",
          type: "pubkey"
        }
      ]
    }
  ],
  accounts: [
    {
      name: "deposit",
      discriminator: [148, 146, 121, 66, 207, 173, 21, 227]
    },
    {
      name: "sessionToken",
      discriminator: [233, 4, 115, 14, 46, 21, 1, 15]
    },
    {
      name: "telegramSession",
      discriminator: [166, 166, 101, 241, 97, 253, 72, 138]
    },
    {
      name: "usernameDeposit",
      discriminator: [242, 23, 53, 35, 55, 192, 177, 246]
    },
    {
      name: "vault",
      discriminator: [211, 8, 232, 43, 2, 152, 117, 119]
    }
  ],
  errors: [
    {
      code: 6000,
      name: "unauthorized",
      msg: "Unauthorized"
    },
    {
      code: 6001,
      name: "overflow",
      msg: "Overflow"
    },
    {
      code: 6002,
      name: "invalidMint",
      msg: "Invalid Mint"
    },
    {
      code: 6003,
      name: "insufficientVault",
      msg: "Insufficient Vault"
    },
    {
      code: 6004,
      name: "insufficientDeposit",
      msg: "Insufficient Deposit"
    },
    {
      code: 6005,
      name: "notVerified",
      msg: "Not Verified"
    },
    {
      code: 6006,
      name: "expiredSignature",
      msg: "Expired Signature"
    },
    {
      code: 6007,
      name: "replay",
      msg: "Replay"
    },
    {
      code: 6008,
      name: "invalidEd25519",
      msg: "Invalid Ed25519"
    },
    {
      code: 6009,
      name: "invalidUsername",
      msg: "Invalid Username"
    },
    {
      code: 6010,
      name: "invalidRecipient",
      msg: "Invalid Recipient"
    },
    {
      code: 6011,
      name: "invalidDepositor",
      msg: "Invalid Depositor"
    }
  ],
  types: [
    {
      name: "deposit",
      docs: ["A deposit account for a user and token mint."],
      type: {
        kind: "struct",
        fields: [
          {
            name: "user",
            type: "pubkey"
          },
          {
            name: "tokenMint",
            type: "pubkey"
          },
          {
            name: "amount",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "modifyDepositArgs",
      type: {
        kind: "struct",
        fields: [
          {
            name: "amount",
            type: "u64"
          },
          {
            name: "increase",
            type: "bool"
          }
        ]
      }
    },
    {
      name: "sessionToken",
      type: {
        kind: "struct",
        fields: [
          {
            name: "authority",
            type: "pubkey"
          },
          {
            name: "targetProgram",
            type: "pubkey"
          },
          {
            name: "sessionSigner",
            type: "pubkey"
          },
          {
            name: "validUntil",
            type: "i64"
          }
        ]
      }
    },
    {
      name: "telegramSession",
      type: {
        kind: "struct",
        fields: [
          {
            name: "userWallet",
            type: "pubkey"
          },
          {
            name: "username",
            type: "string"
          },
          {
            name: "validationBytes",
            type: "bytes"
          },
          {
            name: "verified",
            type: "bool"
          },
          {
            name: "authAt",
            type: "u64"
          },
          {
            name: "verifiedAt",
            type: {
              option: "u64"
            }
          }
        ]
      }
    },
    {
      name: "usernameDeposit",
      docs: ["A deposit account for a telegram username and token mint."],
      type: {
        kind: "struct",
        fields: [
          {
            name: "username",
            type: "string"
          },
          {
            name: "tokenMint",
            type: "pubkey"
          },
          {
            name: "amount",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "vault",
      docs: [
        "A vault storing deposited tokens.",
        "Has a dummy field because Anchor requires it."
      ],
      type: {
        kind: "struct",
        fields: [
          {
            name: "dummy",
            type: "u8"
          }
        ]
      }
    }
  ]
};

// src/constants.ts
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
var PROGRAM_ID = new PublicKey("97FzQdWi26mFNR21AbQNg4KqofiCLqQydQfAvRQMcXhV");
var DELEGATION_PROGRAM_ID = new PublicKey("DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh");
var PERMISSION_PROGRAM_ID = new PublicKey("ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1");
var MAGIC_PROGRAM_ID = new PublicKey("Magic11111111111111111111111111111111111111");
var MAGIC_CONTEXT_ID = new PublicKey("MagicContext1111111111111111111111111111111");
var DEPOSIT_SEED = "deposit";
var DEPOSIT_SEED_BYTES = Buffer.from(DEPOSIT_SEED);
var USERNAME_DEPOSIT_SEED = "username_deposit";
var USERNAME_DEPOSIT_SEED_BYTES = Buffer.from(USERNAME_DEPOSIT_SEED);
var VAULT_SEED = "vault";
var VAULT_SEED_BYTES = Buffer.from(VAULT_SEED);
var PERMISSION_SEED = "permission:";
var PERMISSION_SEED_BYTES = Buffer.from(PERMISSION_SEED);
function solToLamports(sol) {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}
function lamportsToSol(lamports) {
  return lamports / LAMPORTS_PER_SOL;
}

// src/pda.ts
import { PublicKey as PublicKey2 } from "@solana/web3.js";
function findDepositPda(user, tokenMint, programId = PROGRAM_ID) {
  return PublicKey2.findProgramAddressSync([DEPOSIT_SEED_BYTES, user.toBuffer(), tokenMint.toBuffer()], programId);
}
function findUsernameDepositPda(username, tokenMint, programId = PROGRAM_ID) {
  return PublicKey2.findProgramAddressSync([USERNAME_DEPOSIT_SEED_BYTES, Buffer.from(username), tokenMint.toBuffer()], programId);
}
function findVaultPda(tokenMint, programId = PROGRAM_ID) {
  return PublicKey2.findProgramAddressSync([VAULT_SEED_BYTES, tokenMint.toBuffer()], programId);
}
function findPermissionPda(account, permissionProgramId = PERMISSION_PROGRAM_ID) {
  return PublicKey2.findProgramAddressSync([PERMISSION_SEED_BYTES, account.toBuffer()], permissionProgramId);
}
function findDelegationRecordPda(account, delegationProgramId = DELEGATION_PROGRAM_ID) {
  return PublicKey2.findProgramAddressSync([Buffer.from("delegation"), account.toBuffer()], delegationProgramId);
}
function findDelegationMetadataPda(account, delegationProgramId = DELEGATION_PROGRAM_ID) {
  return PublicKey2.findProgramAddressSync([Buffer.from("delegation-metadata"), account.toBuffer()], delegationProgramId);
}
function findBufferPda(account, ownerProgramId = PROGRAM_ID) {
  return PublicKey2.findProgramAddressSync([Buffer.from("buffer"), account.toBuffer()], ownerProgramId);
}

// src/wallet-adapter.ts
import {
  VersionedTransaction
} from "@solana/web3.js";

// src/types.ts
function isKeypair(signer) {
  return "secretKey" in signer && signer.secretKey instanceof Uint8Array;
}
function isAnchorProvider(signer) {
  return "wallet" in signer && "connection" in signer && "opts" in signer;
}
function isWalletLike(signer) {
  return "publicKey" in signer && "signTransaction" in signer && "signAllTransactions" in signer && !isKeypair(signer) && !isAnchorProvider(signer);
}

// src/wallet-adapter.ts
class InternalWalletAdapter {
  signer;
  publicKey;
  constructor(signer, publicKey) {
    this.signer = signer;
    this.publicKey = publicKey;
  }
  static from(signer) {
    const publicKey = InternalWalletAdapter.getPublicKey(signer);
    return new InternalWalletAdapter(signer, publicKey);
  }
  static getPublicKey(signer) {
    if (isKeypair(signer)) {
      return signer.publicKey;
    }
    if (isAnchorProvider(signer)) {
      return signer.wallet.publicKey;
    }
    return signer.publicKey;
  }
  async signTransaction(tx) {
    if (isKeypair(this.signer)) {
      return this.signWithKeypair(tx, this.signer);
    }
    if (isAnchorProvider(this.signer)) {
      return this.signer.wallet.signTransaction(tx);
    }
    return this.signer.signTransaction(tx);
  }
  async signAllTransactions(txs) {
    if (isKeypair(this.signer)) {
      return txs.map((tx) => this.signWithKeypair(tx, this.signer));
    }
    if (isAnchorProvider(this.signer)) {
      return this.signer.wallet.signAllTransactions(txs);
    }
    return this.signer.signAllTransactions(txs);
  }
  signWithKeypair(tx, keypair) {
    if (tx instanceof VersionedTransaction) {
      tx.sign([keypair]);
    } else {
      tx.partialSign(keypair);
    }
    return tx;
  }
}

// src/LoyalPrivateTransactionsClient.ts
function createProgram(provider) {
  return new Program(IDL, provider);
}
function isMagicRouterConnection(connection) {
  return typeof connection.getLatestBlockhashForTransaction === "function";
}
function patchProviderForMagicRouter(provider, wallet) {
  if (!isMagicRouterConnection(provider.connection)) {
    return provider;
  }
  provider.sendAndConfirm = async (tx, signers, opts) => {
    const options = opts ?? provider.opts;
    if (tx instanceof VersionedTransaction2) {
      if (signers) {
        tx.sign(signers);
      }
      const signedTx2 = await wallet.signTransaction(tx);
      return sendAndConfirmRawTransaction(provider.connection, Buffer.from(signedTx2.serialize()), options);
    }
    tx.feePayer = tx.feePayer ?? wallet.publicKey;
    if (signers) {
      for (const signer of signers) {
        tx.partialSign(signer);
      }
    }
    const blockhash = opts?.blockhash ?? await provider.connection.getLatestBlockhash(options?.commitment);
    tx.recentBlockhash = blockhash.blockhash;
    tx.lastValidBlockHeight = blockhash.lastValidBlockHeight;
    const signedTx = await wallet.signTransaction(tx);
    return sendAndConfirmRawTransaction(provider.connection, Buffer.from(signedTx.serialize()), options);
  };
  return provider;
}

class LoyalPrivateTransactionsClient {
  program;
  wallet;
  constructor(program, wallet) {
    this.program = program;
    this.wallet = wallet;
  }
  static fromProvider(provider) {
    const wallet = InternalWalletAdapter.from(provider);
    const patchedProvider = patchProviderForMagicRouter(provider, wallet);
    const program = createProgram(patchedProvider);
    return new LoyalPrivateTransactionsClient(program, wallet);
  }
  static from(connection, signer) {
    const adapter = InternalWalletAdapter.from(signer);
    const provider = patchProviderForMagicRouter(new AnchorProvider(connection, adapter, {
      commitment: "confirmed"
    }), adapter);
    const program = createProgram(provider);
    return new LoyalPrivateTransactionsClient(program, adapter);
  }
  static fromWallet(connection, wallet) {
    return LoyalPrivateTransactionsClient.from(connection, wallet);
  }
  static fromKeypair(connection, keypair) {
    return LoyalPrivateTransactionsClient.from(connection, keypair);
  }
  static async fromEphemeral(config) {
    const {
      signer,
      rpcEndpoint,
      wsEndpoint,
      commitment = "confirmed"
    } = config;
    const connection = new Connection(rpcEndpoint, {
      wsEndpoint,
      commitment
    });
    return LoyalPrivateTransactionsClient.from(connection, signer);
  }
  async initializeDeposit(params) {
    const { user, tokenMint, payer, rpcOptions } = params;
    const signature = await this.program.methods.initializeDeposit().accountsPartial({
      payer,
      user,
      tokenMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId
    }).rpc(this.buildRpcOptions(rpcOptions));
    return signature;
  }
  async modifyBalance(params) {
    const {
      user,
      tokenMint,
      amount,
      increase,
      payer,
      userTokenAccount,
      rpcOptions
    } = params;
    const [depositPda] = findDepositPda(user, tokenMint);
    const [vaultPda] = findVaultPda(tokenMint);
    const vaultTokenAccount = getAssociatedTokenAddressSync(tokenMint, vaultPda, true, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
    const signature = await this.program.methods.modifyBalance({ amount: new BN(amount.toString()), increase }).accountsPartial({
      payer,
      user,
      vault: vaultPda,
      deposit: depositPda,
      userTokenAccount,
      vaultTokenAccount,
      tokenMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId
    }).rpc(this.buildRpcOptions(rpcOptions));
    const deposit = await this.getDeposit(user, tokenMint);
    if (!deposit) {
      throw new Error("Failed to fetch deposit after modification");
    }
    return { signature, deposit };
  }
  async depositForUsername(params) {
    const {
      username,
      tokenMint,
      amount,
      depositor,
      payer,
      depositorTokenAccount,
      rpcOptions
    } = params;
    this.validateUsername(username);
    const [depositPda] = findUsernameDepositPda(username, tokenMint);
    const [vaultPda] = findVaultPda(tokenMint);
    const vaultTokenAccount = getAssociatedTokenAddressSync(tokenMint, vaultPda, true, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
    const signature = await this.program.methods.depositForUsername(username, new BN(amount.toString())).accountsPartial({
      payer,
      depositor,
      deposit: depositPda,
      vault: vaultPda,
      vaultTokenAccount,
      depositorTokenAccount,
      tokenMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId
    }).rpc(this.buildRpcOptions(rpcOptions));
    return signature;
  }
  async claimUsernameDeposit(params) {
    const {
      username,
      tokenMint,
      amount,
      recipientTokenAccount,
      session,
      rpcOptions
    } = params;
    this.validateUsername(username);
    const [depositPda] = findUsernameDepositPda(username, tokenMint);
    const [vaultPda] = findVaultPda(tokenMint);
    const vaultTokenAccount = getAssociatedTokenAddressSync(tokenMint, vaultPda, true, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
    const signature = await this.program.methods.claimUsernameDeposit(new BN(amount.toString())).accountsPartial({
      recipientTokenAccount,
      vault: vaultPda,
      vaultTokenAccount,
      deposit: depositPda,
      tokenMint,
      session,
      tokenProgram: TOKEN_PROGRAM_ID
    }).rpc(this.buildRpcOptions(rpcOptions));
    return signature;
  }
  async createPermission(params) {
    const { user, tokenMint, payer, rpcOptions } = params;
    const [depositPda] = findDepositPda(user, tokenMint);
    const [permissionPda] = findPermissionPda(depositPda);
    if (await this.permissionAccountExists(permissionPda)) {
      return "permission-exists";
    }
    try {
      const signature = await this.program.methods.createPermission().accountsPartial({
        payer,
        user,
        deposit: depositPda,
        permission: permissionPda,
        permissionProgram: PERMISSION_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      }).rpc(this.buildRpcOptions(rpcOptions));
      return signature;
    } catch (err) {
      if (this.isAccountAlreadyInUse(err)) {
        return "permission-exists";
      }
      throw err;
    }
  }
  async createUsernamePermission(params) {
    const { username, tokenMint, session, authority, payer, rpcOptions } = params;
    this.validateUsername(username);
    const [depositPda] = findUsernameDepositPda(username, tokenMint);
    const [permissionPda] = findPermissionPda(depositPda);
    if (await this.permissionAccountExists(permissionPda)) {
      return "permission-exists";
    }
    try {
      const signature = await this.program.methods.createUsernamePermission().accountsPartial({
        payer,
        authority,
        deposit: depositPda,
        session,
        permission: permissionPda,
        permissionProgram: PERMISSION_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      }).rpc(this.buildRpcOptions(rpcOptions));
      return signature;
    } catch (err) {
      if (this.isAccountAlreadyInUse(err)) {
        return "permission-exists";
      }
      throw err;
    }
  }
  async delegateDeposit(params) {
    const { user, tokenMint, payer, validator, rpcOptions } = params;
    const [depositPda] = findDepositPda(user, tokenMint);
    const [bufferPda] = findBufferPda(depositPda);
    const [delegationRecordPda] = findDelegationRecordPda(depositPda);
    const [delegationMetadataPda] = findDelegationMetadataPda(depositPda);
    const accounts = {
      payer,
      bufferDeposit: bufferPda,
      delegationRecordDeposit: delegationRecordPda,
      delegationMetadataDeposit: delegationMetadataPda,
      deposit: depositPda,
      ownerProgram: PROGRAM_ID,
      delegationProgram: DELEGATION_PROGRAM_ID,
      systemProgram: SystemProgram.programId
    };
    accounts.validator = validator ?? null;
    const signature = await this.program.methods.delegate(user, tokenMint).accountsPartial(accounts).rpc(this.buildRpcOptions(rpcOptions));
    return signature;
  }
  async delegateUsernameDeposit(params) {
    const { username, tokenMint, session, payer, validator, rpcOptions } = params;
    this.validateUsername(username);
    const [depositPda] = findUsernameDepositPda(username, tokenMint);
    const [bufferPda] = findBufferPda(depositPda);
    const [delegationRecordPda] = findDelegationRecordPda(depositPda);
    const [delegationMetadataPda] = findDelegationMetadataPda(depositPda);
    const accounts = {
      payer,
      session,
      bufferDeposit: bufferPda,
      delegationRecordDeposit: delegationRecordPda,
      delegationMetadataDeposit: delegationMetadataPda,
      deposit: depositPda,
      ownerProgram: PROGRAM_ID,
      delegationProgram: DELEGATION_PROGRAM_ID,
      systemProgram: SystemProgram.programId
    };
    accounts.validator = validator ?? null;
    const signature = await this.program.methods.delegateUsernameDeposit(username, tokenMint).accountsPartial(accounts).rpc(this.buildRpcOptions(rpcOptions));
    return signature;
  }
  async undelegateDeposit(params) {
    const {
      user,
      tokenMint,
      payer,
      sessionToken,
      magicProgram,
      magicContext,
      rpcOptions
    } = params;
    const [depositPda] = findDepositPda(user, tokenMint);
    const accounts = {
      user,
      payer,
      deposit: depositPda,
      magicProgram,
      magicContext
    };
    accounts.sessionToken = sessionToken ?? null;
    const signature = await this.program.methods.undelegate().accountsPartial(accounts).rpc(this.buildRpcOptions(rpcOptions));
    return signature;
  }
  async undelegateUsernameDeposit(params) {
    const {
      username,
      tokenMint,
      session,
      payer,
      magicProgram,
      magicContext,
      rpcOptions
    } = params;
    this.validateUsername(username);
    const [depositPda] = findUsernameDepositPda(username, tokenMint);
    const signature = await this.program.methods.undelegateUsernameDeposit(username, tokenMint).accountsPartial({
      payer,
      session,
      deposit: depositPda,
      magicProgram,
      magicContext
    }).rpc(this.buildRpcOptions(rpcOptions));
    return signature;
  }
  async transferDeposit(params) {
    const {
      user,
      tokenMint,
      destinationUser,
      amount,
      payer,
      sessionToken,
      rpcOptions
    } = params;
    const [sourceDepositPda] = findDepositPda(user, tokenMint);
    const [destinationDepositPda] = findDepositPda(destinationUser, tokenMint);
    const accounts = {
      user,
      payer,
      sourceDeposit: sourceDepositPda,
      destinationDeposit: destinationDepositPda,
      tokenMint,
      systemProgram: SystemProgram.programId
    };
    accounts.sessionToken = sessionToken ?? null;
    const signature = await this.program.methods.transferDeposit(new BN(amount.toString())).accountsPartial(accounts).rpc(this.buildRpcOptions(rpcOptions));
    return signature;
  }
  async transferToUsernameDeposit(params) {
    const {
      username,
      tokenMint,
      amount,
      user,
      payer,
      sessionToken,
      rpcOptions
    } = params;
    this.validateUsername(username);
    const [sourceDepositPda] = findDepositPda(user, tokenMint);
    const [destinationDepositPda] = findUsernameDepositPda(username, tokenMint);
    const accounts = {
      user,
      payer,
      sourceDeposit: sourceDepositPda,
      destinationDeposit: destinationDepositPda,
      tokenMint,
      systemProgram: SystemProgram.programId
    };
    accounts.sessionToken = sessionToken ?? null;
    const signature = await this.program.methods.transferToUsernameDeposit(new BN(amount.toString())).accountsPartial(accounts).rpc(this.buildRpcOptions(rpcOptions));
    return signature;
  }
  async getDeposit(user, tokenMint) {
    const [depositPda] = findDepositPda(user, tokenMint);
    try {
      const account = await this.program.account.deposit.fetch(depositPda);
      return {
        user: account.user,
        tokenMint: account.tokenMint,
        amount: BigInt(account.amount.toString()),
        address: depositPda
      };
    } catch {
      return null;
    }
  }
  async getUsernameDeposit(username, tokenMint) {
    const [depositPda] = findUsernameDepositPda(username, tokenMint);
    try {
      const account = await this.program.account.usernameDeposit.fetch(depositPda);
      return {
        username: account.username,
        tokenMint: account.tokenMint,
        amount: BigInt(account.amount.toString()),
        address: depositPda
      };
    } catch {
      return null;
    }
  }
  findDepositPda(user, tokenMint) {
    return findDepositPda(user, tokenMint, PROGRAM_ID);
  }
  findUsernameDepositPda(username, tokenMint) {
    return findUsernameDepositPda(username, tokenMint, PROGRAM_ID);
  }
  findVaultPda(tokenMint) {
    return findVaultPda(tokenMint, PROGRAM_ID);
  }
  get publicKey() {
    return this.wallet.publicKey;
  }
  getProgram() {
    return this.program;
  }
  getProgramId() {
    return PROGRAM_ID;
  }
  validateUsername(username) {
    if (!username || username.length < 5 || username.length > 32) {
      throw new Error("Username must be between 5 and 32 characters");
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new Error("Username can only contain alphanumeric characters and underscores");
    }
  }
  buildRpcOptions(options) {
    return {
      skipPreflight: options?.skipPreflight,
      preflightCommitment: options?.preflightCommitment,
      maxRetries: options?.maxRetries
    };
  }
  async permissionAccountExists(permission) {
    const info = await this.program.provider.connection.getAccountInfo(permission);
    return !!info && info.owner.equals(PERMISSION_PROGRAM_ID);
  }
  isAccountAlreadyInUse(error) {
    const message = error?.message ?? "";
    if (message.includes("already in use")) {
      return true;
    }
    const logs = error?.logs ?? error?.transactionLogs;
    if (Array.isArray(logs)) {
      return logs.some((log) => log.includes("already in use"));
    }
    return false;
  }
}
export {
  solToLamports,
  lamportsToSol,
  isWalletLike,
  isKeypair,
  isAnchorProvider,
  findVaultPda,
  findUsernameDepositPda,
  findPermissionPda,
  findDepositPda,
  findDelegationRecordPda,
  findDelegationMetadataPda,
  findBufferPda,
  VAULT_SEED_BYTES,
  VAULT_SEED,
  USERNAME_DEPOSIT_SEED_BYTES,
  USERNAME_DEPOSIT_SEED,
  PROGRAM_ID,
  PERMISSION_SEED_BYTES,
  PERMISSION_SEED,
  PERMISSION_PROGRAM_ID,
  MAGIC_PROGRAM_ID,
  MAGIC_CONTEXT_ID,
  LoyalPrivateTransactionsClient,
  LAMPORTS_PER_SOL,
  IDL,
  DEPOSIT_SEED_BYTES,
  DEPOSIT_SEED,
  DELEGATION_PROGRAM_ID
};
