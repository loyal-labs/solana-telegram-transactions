"use client";

import Turnstile from "react-turnstile";

type TurnstileWidgetProps = {
  onVerify: (token: string) => void;
};

const SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAACowEozkJ4pWS0Xd";

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
