## Building Solana transactions over Telegram

Building this over 24h stream, please, have mercy on our souls.

Plan:
- Frontend setup:
    -- Telegram intergration: ui + extracting user initData to pass to PDA for verification.
    -- Separate page for sending transactions to avoid mini app lock-in.

- Smart contracts setup:
    -- PDA for escrow + set up some basic testing

- Arcium circuits setup:
    -- Expand PDA to handle verification requests from the client
    -- Implement Arcium circuit to verify the data from the client
    -- Implement the callback account to release the funds