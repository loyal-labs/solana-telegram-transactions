# How-tos
## Commit Message Style
We use Conventional Commits for commit messages and pull request titles.

1. Install dependencies:
```bash
bun install
```

2. Enable repo hooks (one-time per clone):
```bash
./scripts/setup-git-hooks.sh
```

Enabled hooks:
- `commit-msg`: validates Conventional Commit messages.
- `pre-push`: runs lint/build checks for both `app` and `admin` before push.
- Bypass only when necessary: `SKIP_VERIFY=1 git push`
- CI note: app build is not run in GitHub Actions; Vercel is the build/deploy gate.

3. Optional local check:
```bash
echo "feat(scope): short description" | bunx commitlint --verbose
```

GitHub pull requests also enforce commit messages and PR titles with the same rules.

## Monorepo Apps
- `app`: Telegram mini-app and API
- `admin`: internal admin dashboard

For Vercel admin deploys from this monorepo, set project Root Directory to `admin`.

## Documentation Structure
- `/docs`: Internal repository and engineering documentation for contributors/operators.
- `/user-docs`: Mintlify-hosted public/user-facing documentation.

Mintlify local preview:
```bash
cd user-docs
mint dev
```

Future subtree sync from `loyal-docs`:
```bash
git subtree pull --prefix=user-docs loyal-docs main --squash
```

## Local Development
1. Run Solana validator
```bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
npm install -g @magicblock-labs/ephemeral-validator@latest
mb-test-validator --reset
```

2. Upgrade and deploy the program
```bash
anchor build && anchor deploy --provider.cluster localnet
```

3. Run tests
```bash
EPHEMERAL_PROVIDER_ENDPOINT="http://localhost:7799" \
EPHEMERAL_WS_ENDPOINT="ws://localhost:7800" \
anchor test \
--provider.cluster localnet \
--skip-local-validator \
--skip-build \
--skip-deploy
```
## Devnet
1. Upgrade and deploy
```bash
anchor build && anchor deploy --provider.cluster devnet
```

2. Run tests
```bash
EPHEMERAL_PROVIDER_ENDPOINT="http://localhost:7799" \
EPHEMERAL_WS_ENDPOINT="ws://localhost:7800" \
anchor test \
--provider.cluster devnet \
--skip-local-validator \
--skip-build \
--skip-deploy
```
