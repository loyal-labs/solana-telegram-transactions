// src/LoyalTransactionsClient.ts
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";

// src/idl.ts
var IDL = {
  address: "4ewpzEPF5xrVAHeRkoe7XS1yKFGQBekD7PgFwEz9SaxY",
  metadata: {
    name: "telegramTransfer",
    version: "0.1.0",
    spec: "0.1.0",
    description: "Created with Anchor"
  },
  instructions: [
    {
      name: "claimDeposit",
      discriminator: [201, 106, 1, 224, 122, 144, 210, 155],
      accounts: [
        {
          name: "recipient",
          docs: ["can be a new address"],
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
                path: "deposit.username",
                account: "deposit"
              }
            ]
          }
        },
        {
          name: "session"
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
      name: "depositForUsername",
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
          name: "vault",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [118, 97, 117, 108, 116]
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
                path: "depositor"
              },
              {
                kind: "arg",
                path: "username"
              }
            ]
          }
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
      name: "refundDeposit",
      discriminator: [19, 19, 78, 50, 187, 10, 162, 229],
      accounts: [
        {
          name: "depositor",
          writable: true,
          signer: true
        },
        {
          name: "vault",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [118, 97, 117, 108, 116]
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
                path: "depositor"
              },
              {
                kind: "account",
                path: "deposit.username",
                account: "deposit"
              }
            ]
          }
        }
      ],
      args: [
        {
          name: "amount",
          type: "u64"
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
      name: "telegramSession",
      discriminator: [166, 166, 101, 241, 97, 253, 72, 138]
    },
    {
      name: "vault",
      discriminator: [211, 8, 232, 43, 2, 152, 117, 119]
    }
  ],
  errors: [
    {
      code: 6000,
      name: "overflow",
      msg: "overflow"
    },
    {
      code: 6001,
      name: "insufficientVault",
      msg: "Insufficient Vault"
    },
    {
      code: 6002,
      name: "insufficientDeposit",
      msg: "Insufficient Deposit"
    },
    {
      code: 6003,
      name: "notVerified",
      msg: "Not Verified"
    },
    {
      code: 6004,
      name: "expiredSignature",
      msg: "Expired Signature"
    },
    {
      code: 6005,
      name: "replay",
      msg: "replay"
    },
    {
      code: 6006,
      name: "invalidEd25519",
      msg: "Invalid Ed25519"
    },
    {
      code: 6007,
      name: "invalidUsername",
      msg: "Invalid Username"
    },
    {
      code: 6008,
      name: "invalidRecipient",
      msg: "Invalid Recipient"
    },
    {
      code: 6009,
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
            name: "username",
            type: "string"
          },
          {
            name: "amount",
            type: "u64"
          },
          {
            name: "lastNonce",
            type: "u64"
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
      name: "vault",
      docs: ["A vault storing deposited SOL."],
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            type: "u8"
          },
          {
            name: "totalDeposited",
            type: "u64"
          }
        ]
      }
    }
  ]
};

// src/constants.ts
import { PublicKey } from "@solana/web3.js";
var PROGRAM_ID = new PublicKey("4ewpzEPF5xrVAHeRkoe7XS1yKFGQBekD7PgFwEz9SaxY");
var DEPOSIT_SEED = "deposit";
var DEPOSIT_SEED_BYTES = Buffer.from(DEPOSIT_SEED);
var VAULT_SEED = "vault";
var VAULT_SEED_BYTES = Buffer.from(VAULT_SEED);
var LAMPORTS_PER_SOL = 1e9;
function solToLamports(sol) {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}
function lamportsToSol(lamports) {
  return lamports / LAMPORTS_PER_SOL;
}

// src/pda.ts
import { PublicKey as PublicKey2 } from "@solana/web3.js";
function findDepositPda(depositor, username, programId = PROGRAM_ID) {
  return PublicKey2.findProgramAddressSync([DEPOSIT_SEED_BYTES, depositor.toBuffer(), Buffer.from(username)], programId);
}
function findVaultPda(programId = PROGRAM_ID) {
  return PublicKey2.findProgramAddressSync([VAULT_SEED_BYTES], programId);
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

// src/LoyalTransactionsClient.ts
function createProgram(provider) {
  return new Program(IDL, provider);
}

class LoyalTransactionsClient {
  program;
  wallet;
  constructor(program, wallet) {
    this.program = program;
    this.wallet = wallet;
  }
  static fromProvider(provider) {
    const program = createProgram(provider);
    const wallet = InternalWalletAdapter.from(provider);
    return new LoyalTransactionsClient(program, wallet);
  }
  static from(connection, signer) {
    const adapter = InternalWalletAdapter.from(signer);
    const provider = new AnchorProvider(connection, adapter, {
      commitment: "confirmed"
    });
    const program = createProgram(provider);
    return new LoyalTransactionsClient(program, adapter);
  }
  static fromWallet(connection, wallet) {
    return LoyalTransactionsClient.from(connection, wallet);
  }
  static fromKeypair(connection, keypair) {
    return LoyalTransactionsClient.from(connection, keypair);
  }
  async deposit(params) {
    const { username, amountLamports, commitment = "confirmed" } = params;
    if (!username || username.length < 5 || username.length > 32) {
      throw new Error("Username must be between 5 and 32 characters");
    }
    if (amountLamports <= 0) {
      throw new Error("Amount must be greater than 0");
    }
    const depositor = this.wallet.publicKey;
    const amountBN = new BN(amountLamports.toString());
    const signature = await this.program.methods.depositForUsername(username, amountBN).accounts({
      payer: depositor,
      depositor
    }).rpc({ commitment });
    console.log("Transaction:", signature);
    const deposit = await this.getDeposit(depositor, username);
    console.log("Deposit:", deposit);
    if (!deposit) {
      throw new Error("Failed to fetch deposit account after transaction");
    }
    return {
      signature,
      deposit
    };
  }
  async refund(params) {
    const { username, amountLamports, commitment = "confirmed" } = params;
    if (!username || username.length < 5 || username.length > 32) {
      throw new Error("Username must be between 5 and 32 characters");
    }
    if (amountLamports <= 0) {
      throw new Error("Amount must be greater than 0");
    }
    const depositor = this.wallet.publicKey;
    const currentDeposit = await this.getDeposit(depositor, username);
    if (!currentDeposit) {
      throw new Error("No deposit found for this username");
    }
    if (currentDeposit.amount < amountLamports) {
      throw new Error("Insufficient deposit");
    }
    const [depositPda] = findDepositPda(depositor, username);
    const [vaultPda] = findVaultPda();
    const amountBN = new BN(amountLamports.toString());
    const signature = await this.program.methods.refundDeposit(amountBN).accountsPartial({
      depositor,
      vault: vaultPda,
      deposit: depositPda
    }).rpc({ commitment });
    console.log("Transaction:", signature);
    const deposit = await this.getDeposit(depositor, username);
    console.log("Deposit:", deposit);
    if (!deposit) {
      throw new Error("Failed to fetch deposit account after transaction");
    }
    return {
      signature,
      deposit
    };
  }
  async getDeposit(depositor, username) {
    const [depositPda] = findDepositPda(depositor, username);
    try {
      const account = await this.program.account.deposit.fetch(depositPda);
      return {
        user: account.user,
        username: account.username,
        amount: account.amount.toNumber(),
        lastNonce: account.lastNonce.toNumber(),
        address: depositPda
      };
    } catch {
      return null;
    }
  }
  findDepositPda(depositor, username) {
    return findDepositPda(depositor, username, PROGRAM_ID);
  }
  findVaultPda() {
    return findVaultPda(PROGRAM_ID);
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
}
export {
  solToLamports,
  lamportsToSol,
  isWalletLike,
  isKeypair,
  isAnchorProvider,
  findVaultPda,
  findDepositPda,
  VAULT_SEED,
  PROGRAM_ID,
  LoyalTransactionsClient,
  LAMPORTS_PER_SOL,
  IDL,
  DEPOSIT_SEED
};
