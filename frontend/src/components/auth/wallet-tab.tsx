"use client";

import { useEffect, useState } from "react";

import { useWalletProofAuth } from "./use-wallet-proof-auth";

export function WalletTab({ onFlowStart }: { onFlowStart?: () => void }) {
  const {
    connected,
    publicKey,
    installedWallets,
    state,
    connectWallet,
    retry,
    startConnectedWalletVerification,
  } = useWalletProofAuth({
    onFlowStart,
  });

  // Delay showing errors so transient failures during connection don't flash
  const isErrorState =
    state.status === "rejected" ||
    state.status === "unsupported" ||
    state.status === "error";
  const [showError, setShowError] = useState(false);
  useEffect(() => {
    if (!isErrorState) {
      setShowError(false);
      return;
    }
    const t = setTimeout(() => setShowError(true), 600);
    return () => clearTimeout(t);
  }, [isErrorState]);

  if (
    state.status === "connecting" ||
    state.status === "awaiting_signature" ||
    state.status === "verifying"
  ) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="text-neutral-500 text-sm">
          {state.status === "connecting"
            ? "Connecting your wallet..."
            : state.status === "awaiting_signature"
              ? "Approve the message signature in your wallet..."
              : "Verifying wallet ownership..."}
        </p>
      </div>
    );
  }

  if (isErrorState && showError) {
    return (
      <div className="flex flex-col gap-4 py-4">
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
        <button
          className="rounded-lg bg-neutral-900 px-4 py-2.5 font-medium text-sm text-white transition hover:bg-neutral-800"
          onClick={retry}
          type="button"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      {connected && publicKey ? (
        <button
          className="rounded-lg bg-neutral-900 px-4 py-2.5 font-medium text-sm text-white transition hover:bg-neutral-800"
          onClick={startConnectedWalletVerification}
          type="button"
        >
          Verify Connected Wallet
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          {installedWallets.map((installedWallet) => (
            <button
              className="flex items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900 text-sm transition hover:bg-neutral-50"
              key={installedWallet.adapter.name}
              onClick={() => connectWallet(installedWallet.adapter.name)}
              type="button"
            >
              {installedWallet.adapter.icon && (
                <img
                  alt={installedWallet.adapter.name}
                  className="h-6 w-6"
                  src={installedWallet.adapter.icon}
                />
              )}
              <span>{installedWallet.adapter.name}</span>
            </button>
          ))}
          {installedWallets.length === 0 && (
            <p className="py-4 text-center text-neutral-500 text-sm">
              No wallet extensions detected.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
