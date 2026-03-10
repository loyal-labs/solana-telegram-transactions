"use client";

import { base64UrlToUint8Array, arrayBufferToBase64Url, normalizeErrorMessage } from "@/lib/passkeys/codecs";

type AttestationResponseWithExtensions = AuthenticatorAttestationResponse & {
  getAuthenticatorData?: () => ArrayBuffer | null;
  getPublicKey?: () => ArrayBuffer | null;
  getPublicKeyAlgorithm?: () => number;
  getTransports?: () => string[];
};

export type PasskeyCreateCeremonyInput = {
  challenge: string;
  appName: string;
  userId: string;
  rpId?: string;
  timeoutMs?: number;
};

export type PasskeyAuthCeremonyInput = {
  challenge: string;
  rpId?: string;
  allowCredentialId?: string;
  publicKey?: string;
  timeoutMs?: number;
};

export type NormalizedCreateAuthenticatorResponse = {
  rawId: string;
  credentialId: string;
  publicKey: string;
};

export type NormalizedAuthAuthenticatorResponse = {
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    publicKey?: string;
  };
};

function ensurePublicKeyCredential(
  credential: Credential | null
): PublicKeyCredential {
  if (!(credential instanceof PublicKeyCredential)) {
    throw new Error("Browser did not return a PublicKeyCredential");
  }

  return credential;
}

export function isChallengeTimeoutError(error: unknown): boolean {
  const message = normalizeErrorMessage(error).toLowerCase();
  return (
    message.includes("timeout") ||
    message.includes("notallowederror") ||
    message.includes("expired") ||
    message.includes("challenge")
  );
}

export async function runCreatePasskeyCeremony(
  input: PasskeyCreateCeremonyInput
): Promise<NormalizedCreateAuthenticatorResponse> {
  const challengeBytes = base64UrlToUint8Array(input.challenge);
  const challenge = challengeBytes.buffer.slice(
    challengeBytes.byteOffset,
    challengeBytes.byteOffset + challengeBytes.byteLength
  ) as ArrayBuffer;

  const credential = ensurePublicKeyCredential(
    await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          id: input.rpId,
          name: input.appName,
        },
        user: {
          id: new TextEncoder().encode(input.userId),
          name: `${input.appName}#${input.userId}`,
          displayName: input.appName,
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
        authenticatorSelection: {
          residentKey: "required",
          requireResidentKey: true,
          userVerification: "required",
        },
        timeout: input.timeoutMs ?? 60_000,
        attestation: "direct",
      },
    })
  );

  const response =
    credential.response as unknown as AttestationResponseWithExtensions;
  const publicKey = response.getPublicKey?.();

  if (!publicKey) {
    throw new Error("Browser did not return a passkey public key");
  }

  return {
    rawId: arrayBufferToBase64Url(credential.rawId),
    credentialId: credential.id,
    publicKey: arrayBufferToBase64Url(publicKey),
  };
}

export async function runAuthPasskeyCeremony(
  input: PasskeyAuthCeremonyInput
): Promise<NormalizedAuthAuthenticatorResponse> {
  const challengeBytes = base64UrlToUint8Array(input.challenge);
  const challenge = challengeBytes.buffer.slice(
    challengeBytes.byteOffset,
    challengeBytes.byteOffset + challengeBytes.byteLength
  ) as ArrayBuffer;
  const allowCredentialId = input.allowCredentialId
    ? base64UrlToUint8Array(input.allowCredentialId)
    : null;

  const credential = ensurePublicKeyCredential(
    await navigator.credentials.get({
      publicKey: {
        challenge,
        ...(allowCredentialId
          ? {
              allowCredentials: [
                {
                  id: allowCredentialId.buffer.slice(
                    allowCredentialId.byteOffset,
                    allowCredentialId.byteOffset + allowCredentialId.byteLength
                  ) as ArrayBuffer,
                  type: "public-key" as const,
                },
              ],
            }
          : {}),
        rpId: input.rpId,
        userVerification: "required",
        timeout: input.timeoutMs ?? 60_000,
      },
    })
  );

  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    response: {
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
      authenticatorData: arrayBufferToBase64Url(response.authenticatorData),
      signature: arrayBufferToBase64Url(response.signature),
      ...(input.publicKey ? { publicKey: input.publicKey } : {}),
    },
  };
}
