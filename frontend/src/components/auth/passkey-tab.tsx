"use client";

import { useCallback, useState } from "react";

import { TurnstileWidget } from "./turnstile-widget";

type Step = "idle" | "captcha" | "waiting" | "success" | "error";

export function PasskeyTab({ onFlowStart }: { onFlowStart?: () => void }) {
  const [step, setStep] = useState<Step>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleStart = useCallback(() => {
    setStep("captcha");
    onFlowStart?.();
  }, [onFlowStart]);

  const handleCaptchaVerify = useCallback((_token: string) => {
    setStep("waiting");

    // Simulate passkey prompt — stub for now
    setTimeout(() => {
      setStep("success");
    }, 1500);
  }, []);

  const handleRetry = useCallback(() => {
    setErrorMessage("");
    setStep("idle");
  }, []);

  if (step === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
          <span className="text-green-600 text-xl">✓</span>
        </div>
        <p className="font-medium text-neutral-900 text-sm">Passkey authenticated</p>
        <p className="text-neutral-500 text-xs">
          This feature is coming soon.
        </p>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <span className="text-red-600 text-xl">!</span>
        </div>
        <p className="font-medium text-neutral-900 text-sm">Authentication failed</p>
        <p className="text-neutral-500 text-xs">{errorMessage}</p>
        <button
          className="mt-2 rounded-lg border border-neutral-200 px-4 py-2 text-neutral-700 text-sm transition hover:bg-neutral-50"
          onClick={handleRetry}
          type="button"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      {step === "idle" && (
        <button
          className="rounded-lg bg-neutral-900 px-4 py-2.5 font-medium text-sm text-white transition hover:bg-neutral-800"
          onClick={handleStart}
          type="button"
        >
          Sign in with Passkey
        </button>
      )}

      {step === "captcha" && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-neutral-500 text-sm">
            Complete the verification
          </p>
          <TurnstileWidget onVerify={handleCaptchaVerify} />
        </div>
      )}

      {step === "waiting" && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-neutral-500 text-sm">
            Waiting for passkey...
          </p>
        </div>
      )}
    </div>
  );
}
