# Localnet testing steps

## Build
```bash
anchor build
# OR
anchor build -p telegram-private-transfer
```

```bash
export TELEGRAM_TRANSFER=4ewpzEPF5xrVAHeRkoe7XS1yKFGQBekD7PgFwEz9SaxY
export TELEGRAM_VERIFICATION=9yiphKYd4b69tR1ZPP8rNwtMeUwWgjYXaXdEzyNziNhz
export TELEGRAM_PRIVATE_TRANSFER=97FzQdWi26mFNR21AbQNg4KqofiCLqQydQfAvRQMcXhV
```

## Solana validator
```bash
# At http://127.0.0.1:8899
mb-test-validator \
    --reset \
    --ledger ~/test-ledger \
    --upgradeable-program DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh ./tests/fixtures/dlp.so ~/.config/solana/id.json \
    --upgradeable-program ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1 ./tests/fixtures/permission.so ~/.config/solana/id.json \
    --upgradeable-program $TELEGRAM_TRANSFER ./target/deploy/telegram_transfer.so ~/.config/solana/id.json \
    --upgradeable-program $TELEGRAM_VERIFICATION ./target/deploy/telegram_verification.so ~/.config/solana/id.json \
    --upgradeable-program $TELEGRAM_PRIVATE_TRANSFER ./target/deploy/telegram_private_transfer.so ~/.config/solana/id.json
```

## Solana ER validator
```bash
# Run in docker because of GLIBC problem
docker run -it --rm --network host \
  -e ACCOUNTS_REMOTE=http://127.0.0.1:8899 \
  -e ACCOUNTS_LIFECYCLE=ephemeral \
  -e ACCOUNTS_COMMIT_FREQUENCY_MILLIS=200 \
  -e ACCOUNTS_COMMIT_COMPUTE_UNIT_PRICE=1 \
  -e VALIDATOR_MILLIS_PER_SLOT=25 \
  -e RPC_ADDR=127.0.0.1 \
  -e RPC_PORT=7799 \
  magicblocklabs/validator
```

## Run tests
```bash
EPHEMERAL_PROVIDER_ENDPOINT="http://localhost:7799" \
  EPHEMERAL_WS_ENDPOINT="ws://localhost:7800" \
  anchor test \
  --provider.cluster localnet \
  --skip-local-validator \
  --skip-build \
  --skip-deploy
```

OR:

```bash
anchor run --provider.cluster localnet test_private_transfer
```

## Upgrade program
```bash
solana program upgrade $(solana program write-buffer target/deploy/telegram_transfer.so --output json | jq -r .buffer) $TELEGRAM_TRANSFER

solana program upgrade $(solana program write-buffer target/deploy/telegram_verification.so --output json | jq -r .buffer) $TELEGRAM_VERIFICATION

solana program upgrade $(solana program write-buffer target/deploy/telegram_private_transfer.so --output json | jq -r .buffer) $TELEGRAM_PRIVATE_TRANSFER
```

## Grab delegate and permission programs
```bash
solana program dump -u devnet DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh dlp.so
solana program dump -u devnet ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1 permission.so
```

## Known errors
If you hit:
```bash
Error: Upgrading program failed: RPC response error -32002: Transaction simulation failed: Error processing Instruction 0: account data too small for instruction; 3 log messages:
  Program BPFLoaderUpgradeab1e11111111111111111111111 invoke [1]
  ProgramData account not large enough
  Program BPFLoaderUpgradeab1e11111111111111111111111 failed: account data too small for instruction
```

Fix: extend data account to some amount
```bash
solana program show $TELEGRAM_PRIVATE_TRANSFER
solana program extend $TELEGRAM_PRIVATE_TRANSFER 218968
```
