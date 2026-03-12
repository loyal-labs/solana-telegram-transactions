export type WalletAuthMessageInput = {
  appName: string;
  origin: string;
  walletAddress: string;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
};

export const WALLET_AUTH_MESSAGE_VERSION = 1;

export function buildWalletAuthMessage({
  appName,
  origin,
  walletAddress,
  nonce,
  issuedAt,
  expiresAt,
}: WalletAuthMessageInput): string {
  return [
    `Sign in to ${appName}`,
    "",
    `Version: ${WALLET_AUTH_MESSAGE_VERSION}`,
    `Origin: ${origin}`,
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    `Expires At: ${expiresAt}`,
    "",
    "This request only verifies that you control this wallet.",
    "This is not a transaction and will not cost gas.",
  ].join("\n");
}
