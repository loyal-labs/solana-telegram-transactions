# Localnet Testing

Step-by-step guide for testing Anchor programs locally with MagicBlock's ephemeral validator.

## Prerequisites

- Solana CLI (`solana-test-validator`)
- Anchor CLI (`anchor`)
- MagicBlock ephemeral validator (`ephemeral-validator`)

## Testing Workflow

You'll need **3 terminals** running simultaneously.

### Step 1: Start Solana Validator

```bash
mb-test-validator --reset
```

This starts the local Solana validator on the default ports.

### Step 2: Start MagicBlock Ephemeral Validator

```bash
RUST_LOG=info ephemeral-validator \
    --accounts-lifecycle ephemeral \
    --remote-cluster development \
    --remote-url http://127.0.0.1:8899 \
    --remote-ws-url ws://127.0.0.1:8900 \
    --rpc-port 7799
```

This connects to your local Solana validator and provides ephemeral account management.

### Step 3: Deploy Programs

```bash
anchor build && anchor deploy --provider.cluster localnet
```

Builds and deploys both programs to localnet.

### Step 4: Run Tests

```bash
EPHEMERAL_PROVIDER_ENDPOINT="http://localhost:7799" \
EPHEMERAL_WS_ENDPOINT="ws://localhost:7800" \
anchor test \
--provider.cluster localnet \
--skip-local-validator \
--skip-build \
--skip-deploy
```

Runs tests against the deployed programs using the ephemeral validator.

## Endpoints Reference

| Service | HTTP | WebSocket |
|---------|------|-----------|
| Solana Validator | `http://127.0.0.1:8899` | `ws://127.0.0.1:8900` |
| Ephemeral Validator | `http://localhost:7799` | `ws://localhost:7800` |

## Test Files

| File | Description |
|------|-------------|
| `tests/telegram-verification.ts` | Telegram signature verification tests |
| `tests/telegram-verification-gasless.ts` | Gasless transaction tests |
