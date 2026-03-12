import type { AuthApiClientError } from "@/lib/auth/client";

export type EmailFlowStatus =
  | "idle"
  | "captcha"
  | "submittingEmail"
  | "awaitingOtp"
  | "verifyingOtp";

export type EmailFlowState = {
  status: EmailFlowStatus;
  email: string;
  authTicketId: string;
  otp: string[];
  errorMessage: string;
  errorDetails: string[];
};

export type EmailFlowAction =
  | { type: "emailChanged"; email: string }
  | { type: "continueRequested" }
  | { type: "submitStarted" }
  | { type: "submitSucceeded"; authTicketId: string }
  | { type: "submitFailed"; error: Pick<AuthApiClientError, "message" | "details"> }
  | { type: "otpChanged"; index: number; value: string }
  | { type: "verifyStarted" }
  | { type: "verifyFailed"; error: Pick<AuthApiClientError, "message" | "details"> }
  | { type: "resetRequested" };

export function createInitialEmailFlowState(): EmailFlowState {
  return {
    status: "idle",
    email: "",
    authTicketId: "",
    otp: Array.from({ length: 6 }, () => ""),
    errorMessage: "",
    errorDetails: [],
  };
}

export function emailFlowReducer(
  state: EmailFlowState,
  action: EmailFlowAction
): EmailFlowState {
  switch (action.type) {
    case "emailChanged":
      return {
        ...state,
        email: action.email,
      };
    case "continueRequested":
      return {
        ...state,
        status: "captcha",
        errorMessage: "",
        errorDetails: [],
      };
    case "submitStarted":
      return {
        ...state,
        status: "submittingEmail",
        errorMessage: "",
        errorDetails: [],
      };
    case "submitSucceeded":
      return {
        ...state,
        status: "awaitingOtp",
        authTicketId: action.authTicketId,
        otp: Array.from({ length: 6 }, () => ""),
        errorMessage: "",
        errorDetails: [],
      };
    case "submitFailed":
      return {
        ...state,
        status: "idle",
        errorMessage: action.error.message,
        errorDetails: action.error.details,
      };
    case "otpChanged": {
      if (!/^\d*$/.test(action.value)) {
        return state;
      }

      const otp = [...state.otp];
      otp[action.index] = action.value.slice(-1);

      return {
        ...state,
        otp,
      };
    }
    case "verifyStarted":
      return {
        ...state,
        status: "verifyingOtp",
        errorMessage: "",
        errorDetails: [],
      };
    case "verifyFailed":
      return {
        ...state,
        status: "awaitingOtp",
        errorMessage: action.error.message,
        errorDetails: action.error.details,
      };
    case "resetRequested":
      return createInitialEmailFlowState();
    default:
      return state;
  }
}
