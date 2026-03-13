"use client";

import { useEmbeddedPasskeySignIn } from "./use-embedded-passkey-sign-in";

export function PasskeyTab({ onFlowStart }: { onFlowStart?: () => void }) {
  const {
    iframeRef,
    step,
    iframeUrl,
    errorMessage,
    errorDetails,
    start,
    retry,
  } = useEmbeddedPasskeySignIn({
    onFlowStart,
  });

  if (step === "starting" || step === "completing") {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="text-neutral-500 text-sm">
          {step === "starting"
            ? "Preparing passkey sign-in..."
            : "Finalizing sign-in..."}
        </p>
      </div>
    );
  }

  if (step === "iframe" && iframeUrl) {
    return (
      <div className="flex flex-col gap-3 py-4">
        <p className="text-neutral-500 text-sm">
          Complete your passkey prompt to finish signing in.
        </p>
        <iframe
          allow="publickey-credentials-create *; publickey-credentials-get *"
          className="h-[420px] w-full rounded-xl border border-neutral-200 bg-white"
          ref={iframeRef}
          src={iframeUrl}
          title="Passkey sign in"
        />
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="flex flex-col gap-4 py-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-sm">
          <p>{errorMessage}</p>
          {errorDetails.length > 0 ? (
            <ul className="mt-2 list-disc pl-5">
              {errorDetails.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
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
      <button
        className="rounded-lg bg-neutral-900 px-4 py-2.5 font-medium text-sm text-white transition hover:bg-neutral-800"
        onClick={() => {
          void start();
        }}
        type="button"
      >
        Sign in with Passkey
      </button>
    </div>
  );
}
