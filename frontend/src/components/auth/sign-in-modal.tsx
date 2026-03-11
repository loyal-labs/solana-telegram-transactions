"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthCapability } from "@/lib/auth/capability";
import { useAuthSession } from "@/contexts/auth-session-context";
import { useSignInModal } from "@/contexts/sign-in-modal-context";

import { EmailTab } from "./email-tab";
import { PasskeyTab } from "./passkey-tab";
import { WalletTab } from "./wallet-tab";

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

  return (
    <Dialog onOpenChange={(open) => !open && close()} open={isOpen}>
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
            <Tabs className="w-full" defaultValue="email">
              <TabsList className="grid w-full grid-cols-3 bg-neutral-100 [&_button]:!text-neutral-500 [&_button:hover]:!text-neutral-700 [&_[data-state=active]]:!bg-white [&_[data-state=active]]:!text-neutral-900 [&_[data-state=active]]:shadow-sm">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="passkey">Passkey</TabsTrigger>
                <TabsTrigger value="wallet">Wallet</TabsTrigger>
              </TabsList>
              <TabsContent value="email">
                <EmailTab />
              </TabsContent>
              <TabsContent value="passkey">
                <PasskeyTab />
              </TabsContent>
              <TabsContent value="wallet">
                <WalletTab />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
