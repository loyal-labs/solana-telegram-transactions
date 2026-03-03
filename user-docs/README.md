# User Docs (Mintlify)

This folder contains Mintlify-hosted public/user-facing documentation.

## Local Development

Install Mintlify CLI (if needed):

```bash
npm i -g mint
```

Run local docs preview from this folder:

```bash
cd user-docs
mint dev
```

## Content Boundaries

- Put end-user/product/developer public docs in `/user-docs`.
- Keep internal contributor/operator/repository docs in `/docs`.

## Upstream Sync Workflow

This tree is imported from the `loyal-docs` repository via subtree squash.

```bash
git subtree pull --prefix=user-docs loyal-docs main --squash
```
