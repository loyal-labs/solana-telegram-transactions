/**
 * Bundled IDL for the Telegram Transfer program
 * Program ID: 4ewpzEPF5xrVAHeRkoe7XS1yKFGQBekD7PgFwEz9SaxY
 */
/**
 * Program IDL type definition (camelCase for JS/TS usage)
 */
export type TelegramTransfer = {
    address: "4ewpzEPF5xrVAHeRkoe7XS1yKFGQBekD7PgFwEz9SaxY";
    metadata: {
        name: "telegramTransfer";
        version: "0.1.0";
        spec: "0.1.0";
        description: "Created with Anchor";
    };
    instructions: [
        {
            name: "claimDeposit";
            discriminator: [201, 106, 1, 224, 122, 144, 210, 155];
            accounts: [
                {
                    name: "recipient";
                    docs: ["can be a new address"];
                    writable: true;
                },
                {
                    name: "vault";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [118, 97, 117, 108, 116];
                            }
                        ];
                    };
                },
                {
                    name: "deposit";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [100, 101, 112, 111, 115, 105, 116];
                            },
                            {
                                kind: "account";
                                path: "deposit.user";
                                account: "deposit";
                            },
                            {
                                kind: "account";
                                path: "deposit.username";
                                account: "deposit";
                            }
                        ];
                    };
                },
                {
                    name: "session";
                },
                {
                    name: "systemProgram";
                    address: "11111111111111111111111111111111";
                }
            ];
            args: [
                {
                    name: "amount";
                    type: "u64";
                }
            ];
        },
        {
            name: "depositForUsername";
            discriminator: [85, 11, 120, 21, 51, 229, 125, 220];
            accounts: [
                {
                    name: "payer";
                    writable: true;
                    signer: true;
                },
                {
                    name: "depositor";
                    writable: true;
                    signer: true;
                },
                {
                    name: "vault";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [118, 97, 117, 108, 116];
                            }
                        ];
                    };
                },
                {
                    name: "deposit";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [100, 101, 112, 111, 115, 105, 116];
                            },
                            {
                                kind: "account";
                                path: "depositor";
                            },
                            {
                                kind: "arg";
                                path: "username";
                            }
                        ];
                    };
                },
                {
                    name: "systemProgram";
                    address: "11111111111111111111111111111111";
                }
            ];
            args: [
                {
                    name: "username";
                    type: "string";
                },
                {
                    name: "amount";
                    type: "u64";
                }
            ];
        },
        {
            name: "refundDeposit";
            discriminator: [19, 19, 78, 50, 187, 10, 162, 229];
            accounts: [
                {
                    name: "depositor";
                    writable: true;
                    signer: true;
                },
                {
                    name: "vault";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [118, 97, 117, 108, 116];
                            }
                        ];
                    };
                },
                {
                    name: "deposit";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [100, 101, 112, 111, 115, 105, 116];
                            },
                            {
                                kind: "account";
                                path: "depositor";
                            },
                            {
                                kind: "account";
                                path: "deposit.username";
                                account: "deposit";
                            }
                        ];
                    };
                }
            ];
            args: [
                {
                    name: "amount";
                    type: "u64";
                }
            ];
        }
    ];
    accounts: [
        {
            name: "deposit";
            discriminator: [148, 146, 121, 66, 207, 173, 21, 227];
        },
        {
            name: "telegramSession";
            discriminator: [166, 166, 101, 241, 97, 253, 72, 138];
        },
        {
            name: "vault";
            discriminator: [211, 8, 232, 43, 2, 152, 117, 119];
        }
    ];
    errors: [
        {
            code: 6000;
            name: "overflow";
            msg: "overflow";
        },
        {
            code: 6001;
            name: "insufficientVault";
            msg: "Insufficient Vault";
        },
        {
            code: 6002;
            name: "insufficientDeposit";
            msg: "Insufficient Deposit";
        },
        {
            code: 6003;
            name: "notVerified";
            msg: "Not Verified";
        },
        {
            code: 6004;
            name: "expiredSignature";
            msg: "Expired Signature";
        },
        {
            code: 6005;
            name: "replay";
            msg: "replay";
        },
        {
            code: 6006;
            name: "invalidEd25519";
            msg: "Invalid Ed25519";
        },
        {
            code: 6007;
            name: "invalidUsername";
            msg: "Invalid Username";
        },
        {
            code: 6008;
            name: "invalidRecipient";
            msg: "Invalid Recipient";
        },
        {
            code: 6009;
            name: "invalidDepositor";
            msg: "Invalid Depositor";
        }
    ];
    types: [
        {
            name: "deposit";
            docs: ["A deposit account for a user and token mint."];
            type: {
                kind: "struct";
                fields: [
                    {
                        name: "user";
                        type: "pubkey";
                    },
                    {
                        name: "username";
                        type: "string";
                    },
                    {
                        name: "amount";
                        type: "u64";
                    },
                    {
                        name: "lastNonce";
                        type: "u64";
                    }
                ];
            };
        },
        {
            name: "telegramSession";
            type: {
                kind: "struct";
                fields: [
                    {
                        name: "userWallet";
                        type: "pubkey";
                    },
                    {
                        name: "username";
                        type: "string";
                    },
                    {
                        name: "validationBytes";
                        type: "bytes";
                    },
                    {
                        name: "verified";
                        type: "bool";
                    },
                    {
                        name: "authAt";
                        type: "u64";
                    },
                    {
                        name: "verifiedAt";
                        type: {
                            option: "u64";
                        };
                    }
                ];
            };
        },
        {
            name: "vault";
            docs: ["A vault storing deposited SOL."];
            type: {
                kind: "struct";
                fields: [
                    {
                        name: "bump";
                        type: "u8";
                    },
                    {
                        name: "totalDeposited";
                        type: "u64";
                    }
                ];
            };
        }
    ];
};
/**
 * Bundled IDL constant for the Telegram Transfer program
 */
export declare const IDL: TelegramTransfer;
