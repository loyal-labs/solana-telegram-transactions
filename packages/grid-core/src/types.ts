import type {
  AuthorizePasskeySessionRequest,
  CreatePasskeySessionRequest,
  GetPasskeyAccountResponse,
  GridEnvironment,
} from "@sqds/grid";

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
