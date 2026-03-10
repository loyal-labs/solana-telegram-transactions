"use client";

import Turnstile from "react-turnstile";

type TurnstileWidgetProps = {
  onVerify: (token: string) => void;
};

const SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"; // Cloudflare test key

export function TurnstileWidget({ onVerify }: TurnstileWidgetProps) {
  return (
    <div className="flex justify-center py-3">
      <Turnstile
        onVerify={onVerify}
        sitekey={SITE_KEY}
        theme="light"
      />
    </div>
  );
}
