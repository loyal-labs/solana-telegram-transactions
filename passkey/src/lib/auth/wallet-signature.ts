import bs58 from "bs58";
import nacl from "tweetnacl";

import { WalletAuthError } from "./wallet-errors";

const textEncoder = new TextEncoder();

export function decodeWalletAddress(walletAddress: string): Uint8Array {
  let decoded: Uint8Array;

  try {
    decoded = bs58.decode(walletAddress);
  } catch {
    throw new WalletAuthError("Wallet address is invalid.", {
      code: "invalid_wallet_address",
      status: 400,
    });
  }

  if (decoded.length !== 32) {
    throw new WalletAuthError("Wallet address is invalid.", {
      code: "invalid_wallet_address",
      status: 400,
    });
  }

  return decoded;
}

export function verifyWalletSignature(args: {
  walletAddress: string;
  message: string;
  signature: string;
}): boolean {
  const publicKey = decodeWalletAddress(args.walletAddress);

  let signatureBytes: Uint8Array;
  try {
    signatureBytes = bs58.decode(args.signature);
  } catch {
    throw new WalletAuthError("Signature is invalid.", {
      code: "invalid_wallet_signature",
      status: 400,
    });
  }

  if (signatureBytes.length !== nacl.sign.signatureLength) {
    throw new WalletAuthError("Signature is invalid.", {
      code: "invalid_wallet_signature",
      status: 400,
    });
  }

  return nacl.sign.detached.verify(
    textEncoder.encode(args.message),
    signatureBytes,
    publicKey
  );
}
