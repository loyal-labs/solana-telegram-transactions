"use client";

import Turnstile from "react-turnstile";

import { usePublicEnv } from "@/contexts/public-env-context";
import type { TurnstileConfig } from "@/lib/core/config/public";

type TurnstileWidgetProps = {
  onVerify: (token: string) => void;
};

type TurnstileWidgetContentProps = TurnstileWidgetProps & {
  turnstile: TurnstileConfig;
};

export function TurnstileWidgetContent({
  onVerify,
  turnstile,
}: TurnstileWidgetContentProps) {
  if (turnstile.mode === "bypass") {
    return (
      <div className="flex justify-center py-3">
        <button
          className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-4 py-2 font-medium text-amber-900 text-sm transition hover:bg-amber-100"
          onClick={() => onVerify(turnstile.verificationToken)}
          type="button"
        >
          Continue with local verification bypass
        </button>
      </div>
    );
  }

  if (turnstile.mode === "misconfigured") {
    return (
      <div className="py-3 text-center text-amber-700 text-sm">
        {turnstile.reason}
      </div>
    );
  }

  return (
    <div className="flex justify-center py-3">
      <Turnstile
        onVerify={onVerify}
        sitekey={turnstile.siteKey}
        theme="light"
      />
    </div>
  );
}

export function TurnstileWidget({ onVerify }: TurnstileWidgetProps) {
  const publicEnv = usePublicEnv();

  return (
    <TurnstileWidgetContent
      onVerify={onVerify}
      turnstile={publicEnv.turnstile}
    />
  );
}
