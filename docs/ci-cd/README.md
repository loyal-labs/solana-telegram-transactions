# CI/CD Commit Style

Conventional Commits are enforced locally and in GitHub CI.

## Overview

| File | Purpose |
|------|---------|
| `commitlint.config.cjs` | Commit message rules (`@commitlint/config-conventional`) |
| `githooks/commit-msg` | Local commit-msg validation hook |
| `.github/workflows/commit-style.yml` | PR checks for commits and PR title |

## Local Setup

Run once per clone:

```bash
bun install
./scripts/setup-git-hooks.sh
```

## Local Check

```bash
echo "feat(scope): short description" | bunx commitlint --verbose
```

## CI Rules

On pull requests, CI validates:

1. All commit messages in the PR range.
2. The pull request title.
