/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/loyal_oracle.json`.
 */
export type LoyalOracle = {
  "address": "9Sg7UG96gVEPChRdT5Y6DKeaiMV5eTYm1phsWArna98t",
  "metadata": {
    "name": "loyalOracle",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "createChat",
      "discriminator": [
        133,
        186,
        254,
        72,
        143,
        178,
        221,
        28
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "contextAccount",
          "writable": true
        },
        {
          "name": "chat",
          "docs": [
            "creates the interaction PDA if needed"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "contextAccount"
              },
              {
                "kind": "arg",
                "path": "chatId"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "chatId",
          "type": "u64"
        },
        {
          "name": "cmk",
          "type": "pubkey"
        },
        {
          "name": "txId",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "createContext",
      "discriminator": [
        87,
        62,
        197,
        44,
        169,
        57,
        243,
        178
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "contextAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  101,
                  120,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "delegateChat",
      "discriminator": [
        50,
        211,
        191,
        65,
        208,
        161,
        231,
        189
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "bufferChat",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "chat"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                125,
                113,
                61,
                60,
                231,
                68,
                249,
                191,
                65,
                156,
                172,
                217,
                75,
                33,
                103,
                114,
                217,
                14,
                55,
                76,
                86,
                25,
                212,
                121,
                20,
                216,
                148,
                201,
                129,
                118,
                192,
                65
              ]
            }
          }
        },
        {
          "name": "delegationRecordChat",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "chat"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "delegationMetadataChat",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
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
                "kind": "account",
                "path": "chat"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "chat",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "contextAccount"
              },
              {
                "kind": "arg",
                "path": "chatId"
              }
            ]
          }
        },
        {
          "name": "contextAccount"
        },
        {
          "name": "ownerProgram",
          "address": "9Sg7UG96gVEPChRdT5Y6DKeaiMV5eTYm1phsWArna98t"
        },
        {
          "name": "delegationProgram",
          "address": "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "chatId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "getDek",
      "discriminator": [
        236,
        216,
        253,
        103,
        17,
        232,
        143,
        109
      ],
      "accounts": [
        {
          "name": "caller",
          "docs": [
            "chat.user OR the oracle identity."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "chat",
          "docs": [
            "Must be owned by this program."
          ],
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "identity",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "processUndelegation",
      "discriminator": [
        196,
        28,
        41,
        206,
        48,
        37,
        51,
        167
      ],
      "accounts": [
        {
          "name": "baseAccount",
          "writable": true
        },
        {
          "name": "buffer"
        },
        {
          "name": "payer",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "accountSeeds",
          "type": {
            "vec": "bytes"
          }
        }
      ]
    },
    {
      "name": "updateStatus",
      "discriminator": [
        147,
        215,
        74,
        174,
        55,
        191,
        42,
        0
      ],
      "accounts": [
        {
          "name": "caller",
          "docs": [
            "chat.user OR the oracle identity."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "chat",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "newStatus",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "chat",
      "discriminator": [
        170,
        4,
        71,
        128,
        185,
        103,
        250,
        177
      ]
    },
    {
      "name": "contextAccount",
      "discriminator": [
        75,
        176,
        185,
        173,
        144,
        35,
        90,
        109
      ]
    },
    {
      "name": "identity",
      "discriminator": [
        58,
        132,
        5,
        12,
        176,
        164,
        85,
        112
      ]
    }
  ],
  "events": [
    {
      "name": "dekResponse",
      "discriminator": [
        114,
        0,
        186,
        146,
        6,
        67,
        29,
        225
      ]
    },
    {
      "name": "statusChanged",
      "discriminator": [
        146,
        235,
        222,
        125,
        145,
        246,
        34,
        240
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "contextOwnerMismatch",
      "msg": "Context owner mismatch"
    },
    {
      "code": 6001,
      "name": "unauthorized",
      "msg": "Unauthorized."
    },
    {
      "code": 6002,
      "name": "hkdfExpandFailed",
      "msg": "HKDF expand failed."
    },
    {
      "code": 6003,
      "name": "invalidChatId",
      "msg": "Provided chat_id is not the next available id for creation."
    },
    {
      "code": 6004,
      "name": "chatIdMismatch",
      "msg": "Chat id does not match the PDA being updated."
    },
    {
      "code": 6005,
      "name": "contextMismatch",
      "msg": "Context does not match the PDA being updated."
    },
    {
      "code": 6006,
      "name": "mathOverflow",
      "msg": "Arithmetic overflow."
    },
    {
      "code": 6007,
      "name": "oracleTxIdMismatch",
      "msg": "Oracle tx id mismatch."
    }
  ],
  "types": [
    {
      "name": "chat",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "context",
            "docs": [
              "---- fixed-size header (stable offsets) ----"
            ],
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "status",
            "type": "u8"
          },
          {
            "name": "cmk",
            "type": "pubkey"
          },
          {
            "name": "txId",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "contextAccount",
      "docs": [
        "--------------------------------------------------",
        "Accounts",
        "--------------------------------------------------"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "nextChatId",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "dekResponse",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "chat",
            "type": "pubkey"
          },
          {
            "name": "chatId",
            "type": "u64"
          },
          {
            "name": "dek",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "identity",
      "type": {
        "kind": "struct",
        "fields": []
      }
    },
    {
      "name": "statusChanged",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "chat",
            "type": "pubkey"
          },
          {
            "name": "chatId",
            "type": "u64"
          },
          {
            "name": "status",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
