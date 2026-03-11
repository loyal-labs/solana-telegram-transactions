"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";

import { useSignInModal } from "@/contexts/sign-in-modal-context";

import { TurnstileWidget } from "./turnstile-widget";

type Step = "connect" | "captcha" | "signing";

export function WalletTab({ onFlowStart }: { onFlowStart?: () => void }) {
  const { connected, select, wallets } = useWallet();
  const { close } = useSignInModal();
  const [step, setStep] = useState<Step>("connect");
  const [errorMessage, setErrorMessage] = useState("");

  // When wallet connects, move to captcha (or close if already verified)
  useEffect(() => {
    if (connected && step === "connect") {
      setStep("captcha");
    }
  }, [connected, step]);

  const handleConnect = useCallback(
    (walletName: string) => {
      const wallet = wallets.find((w) => w.adapter.name === walletName);
      if (wallet) {
        select(wallet.adapter.name);
        onFlowStart?.();
      }
    },
    [wallets, select, onFlowStart]
  );

  const handleCaptchaVerify = useCallback(
    async (_token: string) => {
      setStep("signing");

      try {
        // TODO: integrate with SIWS verification flow
        await new Promise((resolve) => setTimeout(resolve, 800));
        close();
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Signing failed"
        );
        setStep("connect");
      }
    },
    [close]
  );

  const handleRetry = useCallback(() => {
    setErrorMessage("");
    setStep(connected ? "captcha" : "connect");
  }, [connected]);

  if (errorMessage) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <span className="text-red-600 text-xl">!</span>
        </div>
        <p className="font-medium text-neutral-900 text-sm">Connection failed</p>
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
      {step === "connect" && (
        <div className="flex flex-col gap-2">
          {wallets
            .filter((w) => w.readyState === "Installed")
            .map((wallet) => (
              <button
                className="flex items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900 text-sm transition hover:bg-neutral-50"
                key={wallet.adapter.name}
                onClick={() => handleConnect(wallet.adapter.name)}
                type="button"
              >
                {wallet.adapter.icon && (
                  <img
                    alt={wallet.adapter.name}
                    className="h-6 w-6"
                    src={wallet.adapter.icon}
                  />
                )}
                <span>{wallet.adapter.name}</span>
              </button>
            ))}
          {wallets.filter(
            (w) => w.readyState === "Installed"
          ).length === 0 && (
            <p className="py-4 text-center text-neutral-500 text-sm">
              No wallet extensions detected.
            </p>
          )}
        </div>
      )}

      {step === "captcha" && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-neutral-500 text-sm">
            Complete the verification
          </p>
          <TurnstileWidget onVerify={handleCaptchaVerify} />
        </div>
      )}

      {step === "signing" && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-neutral-500 text-sm">
            Verifying...
          </p>
        </div>
      )}
    </div>
  );
}
