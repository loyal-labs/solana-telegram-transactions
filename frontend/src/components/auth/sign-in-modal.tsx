"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthCapability } from "@/lib/auth/capability";
import { useAuthSession } from "@/contexts/auth-session-context";
import { usePublicEnv } from "@/contexts/public-env-context";
import { useSignInModal } from "@/contexts/sign-in-modal-context";

import { EmailTab } from "./email-tab";
import { PasskeyTab } from "./passkey-tab";
import { TurnstileWidget } from "./turnstile-widget";
import { WalletTab } from "./wallet-tab";

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 border-t border-neutral-200" />
      <span className="text-neutral-400 text-xs uppercase tracking-wide">or</span>
      <div className="flex-1 border-t border-neutral-200" />
    </div>
  );
}

function ConnectedView() {
  const { publicKey, disconnect } = useWallet();
  const { logout, user } = useAuthSession();
  const { close } = useSignInModal();
  const { hasEmailSession, hasWalletConnection } = useAuthCapability();
  const [copied, setCopied] = useState(false);
  const address = publicKey?.toBase58() ?? "";
  const email = user?.email ?? "";

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [address]);

  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
        <span className="text-green-600 text-xl">✓</span>
      </div>
      <p className="font-medium text-sm">
        {hasWalletConnection ? "Connected" : "Signed in"}
      </p>
      {email ? (
        <p className="max-w-full break-all px-4 text-center text-neutral-500 text-xs">
          {email}
        </p>
      ) : null}
      {address ? (
        <button
          className="group max-w-full cursor-pointer break-all px-4 text-center font-mono text-neutral-500 text-xs transition hover:text-neutral-700"
          onClick={handleCopy}
          title="Copy address"
          type="button"
        >
          {address}
          <span className="ml-1 inline-block text-neutral-400 group-hover:text-neutral-600">
            {copied ? "✓" : "⧉"}
          </span>
        </button>
      ) : null}
      {hasEmailSession ? (
        <button
          className="mt-1 text-neutral-400 text-xs underline transition hover:text-neutral-700"
          onClick={async () => {
            await logout();
            close();
          }}
          type="button"
        >
          Sign out
        </button>
      ) : null}
      {hasWalletConnection ? (
        <button
          className="text-neutral-400 text-xs underline transition hover:text-neutral-700"
          onClick={async () => {
            await disconnect();
            close();
          }}
          type="button"
        >
          Disconnect wallet
        </button>
      ) : null}
    </div>
  );
}

export function SignInModal() {
  const { isOpen, close } = useSignInModal();
  const { capability } = useAuthCapability();
  const publicEnv = usePublicEnv();
  const { wallets } = useWallet();
  const [activeSection, setActiveSection] = useState<
    "email" | "passkey" | "wallet" | null
  >(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileMode = publicEnv.turnstile.mode;
  const turnstileVerificationToken =
    turnstileMode === "bypass"
      ? publicEnv.turnstile.verificationToken
      : null;

  // Auto-resolve captcha for bypass (local dev) and misconfigured environments
  const needsCaptchaWidget = turnstileMode === "widget";
  useEffect(() => {
    if (!needsCaptchaWidget && captchaToken === null) {
      setCaptchaToken(
        turnstileMode === "bypass"
          ? turnstileVerificationToken
          : "captcha-skipped"
      );
    }
  }, [
    captchaToken,
    needsCaptchaWidget,
    turnstileMode,
    turnstileVerificationToken,
  ]);

  const hasInstalledWallets = wallets.some(
    (w) => w.readyState === "Installed"
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        close();
        setActiveSection(null);
        setCaptchaToken(null);
      }
    },
    [close]
  );

  const handleBack = useCallback(() => setActiveSection(null), []);

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <DialogContent className="border-neutral-200 bg-white text-neutral-900 sm:max-w-[420px] [&_[data-slot=dialog-close]]:text-neutral-500">
        {capability !== "anonymous" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-neutral-900">Account</DialogTitle>
              <DialogDescription className="sr-only">
                Signed in
              </DialogDescription>
            </DialogHeader>
            <ConnectedView />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-neutral-900">Sign In</DialogTitle>
              <DialogDescription className="text-neutral-500">
                Choose your preferred sign-in method.
              </DialogDescription>
            </DialogHeader>
            {captchaToken === null ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <p className="text-neutral-500 text-sm">
                  Complete verification to continue
                </p>
                <TurnstileWidget onVerify={setCaptchaToken} />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {activeSection && (
                  <button
                    className="self-start text-neutral-400 text-xs transition hover:text-neutral-700"
                    onClick={handleBack}
                    type="button"
                  >
                    ← All sign-in options
                  </button>
                )}

                {(!activeSection || activeSection === "email") && (
                  <EmailTab
                    captchaToken={captchaToken}
                    onFlowStart={() => setActiveSection("email")}
                  />
                )}

                {!activeSection && <Divider />}

                {(!activeSection || activeSection === "passkey") && (
                  <PasskeyTab
                    onFlowStart={() => setActiveSection("passkey")}
                  />
                )}

                {!activeSection && hasInstalledWallets && <Divider />}

                {hasInstalledWallets &&
                  (!activeSection || activeSection === "wallet") && (
                    <WalletTab
                      onFlowStart={() => setActiveSection("wallet")}
                    />
                  )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
