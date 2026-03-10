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
  timeoutMs?: number;
};

export type NormalizedCreateAuthenticatorResponse = {
  id: string;
  rawId: string;
  type: string;
  response: {
    clientDataJSON: string;
    attestationObject: string;
    authenticatorData?: string;
    publicKey?: string;
    publicKeyAlgorithm?: number;
    transports?: string[];
  };
};

export type NormalizedAuthAuthenticatorResponse = {
  id: string;
  rawId: string;
  type: string;
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle: string | null;
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
  const authenticatorData = response.getAuthenticatorData?.();

  return {
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
      attestationObject: arrayBufferToBase64Url(response.attestationObject),
      authenticatorData: authenticatorData
        ? arrayBufferToBase64Url(authenticatorData)
        : undefined,
      publicKey: publicKey ? arrayBufferToBase64Url(publicKey) : undefined,
      publicKeyAlgorithm: response.getPublicKeyAlgorithm?.(),
      transports: response.getTransports?.(),
    },
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

  const credential = ensurePublicKeyCredential(
    await navigator.credentials.get({
      publicKey: {
        challenge,
        userVerification: "required",
        timeout: input.timeoutMs ?? 60_000,
      },
    })
  );

  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
      authenticatorData: arrayBufferToBase64Url(response.authenticatorData),
      signature: arrayBufferToBase64Url(response.signature),
      userHandle: response.userHandle
        ? arrayBufferToBase64Url(response.userHandle)
        : null,
    },
  };
}
