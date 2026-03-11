"use client";

import { useCallback, useReducer, useRef } from "react";

import { AuthApiClientError, authApiClient } from "@/lib/auth/client";
import { useAuthSession } from "@/contexts/auth-session-context";
import { useSignInModal } from "@/contexts/sign-in-modal-context";
import {
  createInitialEmailFlowState,
  emailFlowReducer,
} from "./email-flow-state";

export function EmailTab({
  captchaToken,
  onFlowStart,
}: {
  captchaToken: string;
  onFlowStart?: () => void;
}) {
  const { setAuthenticatedUser } = useAuthSession();
  const { close } = useSignInModal();
  const [state, dispatch] = useReducer(
    emailFlowReducer,
    undefined,
    createInitialEmailFlowState
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const submitEmail = useCallback(
    async (turnstileToken: string) => {
      dispatch({ type: "submitStarted" });

      try {
        const response = await authApiClient.startEmailAuth({
          email: state.email.trim(),
          turnstileToken,
        });

        dispatch({
          type: "submitSucceeded",
          authTicketId: response.authTicketId,
        });
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } catch (error) {
        const authError =
          error instanceof AuthApiClientError
            ? error
            : new AuthApiClientError("Failed to start email authentication.", {
                code: "email_auth_start_failed",
                status: 500,
              });

        dispatch({
          type: "submitFailed",
          error: authError,
        });
      }
    },
    [state.email]
  );

  const handleEmailSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (state.email.trim()) {
        onFlowStart?.();
        submitEmail(captchaToken);
      }
    },
    [state.email, onFlowStart, captchaToken, submitEmail]
  );

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      dispatch({ type: "otpChanged", index, value });

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    []
  );

  const handleOtpKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !state.otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [state.otp]
  );

  const handleVerifyCode = useCallback(async () => {
    const otpCode = state.otp.join("");
    if (otpCode.length !== state.otp.length || !state.authTicketId) {
      return;
    }

    dispatch({ type: "verifyStarted" });

    try {
      const user = await authApiClient.verifyEmailAuth({
        authTicketId: state.authTicketId,
        otpCode,
      });

      setAuthenticatedUser(user);
      close();
    } catch (error) {
      const authError =
        error instanceof AuthApiClientError
          ? error
          : new AuthApiClientError("Failed to verify email authentication.", {
              code: "email_auth_verify_failed",
              status: 500,
            });

      dispatch({
        type: "verifyFailed",
        error: authError,
      });
    }
  }, [close, setAuthenticatedUser, state.authTicketId, state.otp]);

  const handleReset = useCallback(() => {
    dispatch({ type: "resetRequested" });
  }, []);

  if (state.status === "submittingEmail" || state.status === "verifyingOtp") {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="text-neutral-500 text-sm">
          {state.status === "submittingEmail"
            ? "Sending your verification code..."
            : "Verifying your code..."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      {state.errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-sm">
          <p>{state.errorMessage}</p>
          {state.errorDetails.length > 0 && (
            <ul className="mt-2 list-disc pl-5">
              {state.errorDetails.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {state.status === "idle" && (
        <form className="flex flex-col gap-3" onSubmit={handleEmailSubmit}>
          <input
            autoFocus
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-neutral-900 text-sm outline-none ring-blue-500 placeholder:text-neutral-400 focus:ring-2"
            onChange={(e) =>
              dispatch({ type: "emailChanged", email: e.target.value })
            }
            placeholder="you@example.com"
            type="email"
            value={state.email}
          />
          <button
            className="rounded-lg bg-neutral-900 px-4 py-2.5 font-medium text-sm text-white transition hover:bg-neutral-800 disabled:opacity-50"
            disabled={!state.email.trim()}
            type="submit"
          >
            Continue with Email
          </button>
        </form>
      )}

      {state.status === "awaitingOtp" && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-neutral-500 text-sm">
            Enter the 6-digit code sent to{" "}
            <span className="font-medium text-neutral-900">{state.email}</span>
          </p>
          <div className="flex gap-2">
            {state.otp.map((digit, i) => (
              <input
                className="h-12 w-10 rounded-lg border border-neutral-200 bg-white text-center font-mono text-neutral-900 text-lg outline-none ring-blue-500 focus:ring-2"
                inputMode="numeric"
                key={i}
                maxLength={1}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                value={digit}
              />
            ))}
          </div>
          <button
            className="rounded-lg bg-neutral-900 px-4 py-2.5 font-medium text-sm text-white transition hover:bg-neutral-800 disabled:opacity-50"
            disabled={state.otp.some((digit) => digit === "")}
            onClick={handleVerifyCode}
            type="button"
          >
            Verify code
          </button>
          <button
            className="text-neutral-500 text-xs underline transition hover:text-neutral-700"
            onClick={handleReset}
            type="button"
          >
            Use a different email
          </button>
        </div>
      )}
    </div>
  );
}
