"use client";

import { useCallback, useRef, useState } from "react";

import { TurnstileWidget } from "./turnstile-widget";

type Step = "email" | "captcha" | "otp" | "success";

export function EmailTab() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(Array.from({ length: 6 }, () => ""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleEmailSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (email.trim()) {
        setStep("captcha");
      }
    },
    [email]
  );

  const handleCaptchaVerify = useCallback((_token: string) => {
    setStep("otp");
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, []);

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;

      const newOtp = [...otp];
      newOtp[index] = value.slice(-1);
      setOtp(newOtp);

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      if (newOtp.every((d) => d !== "")) {
        setStep("success");
      }
    },
    [otp]
  );

  const handleOtpKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [otp]
  );

  if (step === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
          <span className="text-green-600 text-xl">✓</span>
        </div>
        <p className="font-medium text-neutral-900 text-sm">Email verified</p>
        <p className="text-neutral-500 text-xs">
          This feature is coming soon.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      {step === "email" && (
        <form className="flex flex-col gap-3" onSubmit={handleEmailSubmit}>
          <input
            autoFocus
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-neutral-900 text-sm outline-none ring-blue-500 placeholder:text-neutral-400 focus:ring-2"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
          <button
            className="rounded-lg bg-neutral-900 px-4 py-2.5 font-medium text-sm text-white transition hover:bg-neutral-800 disabled:opacity-50"
            disabled={!email.trim()}
            type="submit"
          >
            Continue with Email
          </button>
        </form>
      )}

      {step === "captcha" && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-neutral-500 text-sm">
            Complete the verification
          </p>
          <TurnstileWidget onVerify={handleCaptchaVerify} />
        </div>
      )}

      {step === "otp" && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-neutral-500 text-sm">
            Enter the 6-digit code sent to{" "}
            <span className="font-medium text-neutral-900">{email}</span>
          </p>
          <div className="flex gap-2">
            {otp.map((digit, i) => (
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
        </div>
      )}
    </div>
  );
}
