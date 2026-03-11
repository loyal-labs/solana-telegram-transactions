import type {
  AuthorizePasskeySessionRequest,
  CreatePasskeySessionRequest,
  GetPasskeyAccountResponse,
  GridEnvironment,
} from "@sqds/grid";
import type {
  GetEmailAuthSessionResponse,
  StartEmailAuthRequest,
  StartEmailAuthResponse,
  VerifyEmailAuthRequest,
  VerifyEmailAuthResponse,
} from "./contracts";

export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export type GridServerRuntimeConfig = {
  environment: GridEnvironment;
  baseUrl?: string;
  apiKey?: string;
};

export type GridAuthRuntimeConfig = {
  authBaseUrl: string;
  fetch?: FetchLike;
};

export type ApiOutcome<T = unknown> = {
  ok: boolean;
  status: number;
  body: T;
};

export type StartPasskeyRegistrationInput = CreatePasskeySessionRequest;

export type StartPasskeySignInInput = AuthorizePasskeySessionRequest;

export type GridAuthClient = {
  startEmailAuth: (
    payload: StartEmailAuthRequest
  ) => Promise<ApiOutcome<StartEmailAuthResponse | unknown>>;
  verifyEmailAuth: (
    payload: VerifyEmailAuthRequest
  ) => Promise<ApiOutcome<VerifyEmailAuthResponse | unknown>>;
  getEmailAuthSession: () => Promise<
    ApiOutcome<GetEmailAuthSessionResponse | unknown>
  >;
  logoutEmailAuth: () => Promise<ApiOutcome<unknown>>;
  startPasskeyRegistration: (
    payload: StartPasskeyRegistrationInput
  ) => Promise<ApiOutcome<unknown>>;
  startPasskeySignIn: (
    payload: StartPasskeySignInInput
  ) => Promise<ApiOutcome<unknown>>;
  getPasskeyAccount: (
    passkeyAddress: string
  ) => Promise<ApiOutcome<GetPasskeyAccountResponse | unknown>>;
};
