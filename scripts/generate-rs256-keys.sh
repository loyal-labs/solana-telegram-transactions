#!/usr/bin/env bash
set -euo pipefail

# Generate RS256 key pair for JWT session token signing/verification.
# Output: single-line PEM strings ready for .env files (newlines replaced with \n literals).

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

openssl genrsa 2048 > "$TMPDIR/private.pem" 2>/dev/null
openssl rsa -in "$TMPDIR/private.pem" -pubout > "$TMPDIR/public.pem" 2>/dev/null

echo ""
echo "# Passkey service (.env)"
echo "AUTH_JWT_RS256_PRIVATE_KEY=\"$(awk '{printf "%s\\n", $0}' "$TMPDIR/private.pem")\""
echo "AUTH_JWT_RS256_PUBLIC_KEY=\"$(awk '{printf "%s\\n", $0}' "$TMPDIR/public.pem")\""
echo ""
echo "# Frontend (.env.local)"
echo "AUTH_SESSION_RS256_PUBLIC_KEY=\"$(awk '{printf "%s\\n", $0}' "$TMPDIR/public.pem")\""
