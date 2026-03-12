import type {
  GetPasskeyAccountResponse,
} from "@sqds/grid";

import type {
  StartPasskeyRegistrationRequest,
  StartPasskeySignInRequest,
} from "@loyal-labs/grid-core";

import type {
  GetAuthSessionResponse,
  StartEmailAuthRequest,
  StartEmailAuthResponse,
  StartPasskeySessionResponse,
  VerifyEmailAuthRequest,
  VerifyEmailAuthResponse,
  WalletChallengeRequest,
  WalletChallengeResponse,
  WalletCompleteRequest,
  WalletCompleteResponse,
} from "./contracts";

export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export type AuthRuntimeConfig = {
  authBaseUrl: string;
  fetch?: FetchLike;
};

export type ApiOutcome<T = unknown> = {
  ok: boolean;
  status: number;
  body: T;
};

export type StartPasskeyRegistrationInput = StartPasskeyRegistrationRequest;

export type StartPasskeySignInInput = StartPasskeySignInRequest;

export type AuthClient = {
  startEmailAuth: (
    payload: StartEmailAuthRequest
  ) => Promise<ApiOutcome<StartEmailAuthResponse | unknown>>;
  verifyEmailAuth: (
    payload: VerifyEmailAuthRequest
  ) => Promise<ApiOutcome<VerifyEmailAuthResponse | unknown>>;
  getAuthSession: () => Promise<ApiOutcome<GetAuthSessionResponse | unknown>>;
  logoutAuthSession: () => Promise<ApiOutcome<unknown>>;
  startPasskeyRegistration: (
    payload: StartPasskeyRegistrationInput
  ) => Promise<ApiOutcome<StartPasskeySessionResponse | unknown>>;
  startPasskeySignIn: (
    payload: StartPasskeySignInInput
  ) => Promise<ApiOutcome<StartPasskeySessionResponse | unknown>>;
  challengeWalletAuth: (
    payload: WalletChallengeRequest
  ) => Promise<ApiOutcome<WalletChallengeResponse | unknown>>;
  completeWalletAuth: (
    payload: WalletCompleteRequest
  ) => Promise<ApiOutcome<WalletCompleteResponse | unknown>>;
  getPasskeyAccount: (
    passkeyAddress: string
  ) => Promise<ApiOutcome<GetPasskeyAccountResponse | unknown>>;
};
