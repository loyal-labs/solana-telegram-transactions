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
import { useSignInModal } from "@/contexts/sign-in-modal-context";

import { EmailTab } from "./email-tab";
import { PasskeyTab } from "./passkey-tab";
import { WalletTab } from "./wallet-tab";

function ConnectedView() {
  const { publicKey, disconnect } = useWallet();
  const { close } = useSignInModal();
  const [copied, setCopied] = useState(false);
  const address = publicKey?.toBase58() ?? "";

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
      <p className="font-medium text-sm">Connected</p>
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
      <button
        className="mt-1 text-neutral-400 text-xs underline transition hover:text-neutral-700"
        onClick={async () => {
          await disconnect();
          close();
        }}
        type="button"
      >
        Disconnect
      </button>
    </div>
  );
}

export function SignInModal() {
  const { isOpen, close } = useSignInModal();
  const { connected } = useWallet();

  return (
    <Dialog onOpenChange={(open) => !open && close()} open={isOpen}>
      <DialogContent className="border-neutral-200 bg-white text-neutral-900 sm:max-w-[420px] [&_[data-slot=dialog-close]]:text-neutral-500">
        {connected ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-neutral-900">Wallet</DialogTitle>
              <DialogDescription className="sr-only">
                Wallet connected
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
            <Tabs className="w-full" defaultValue="wallet">
              <TabsList className="grid w-full grid-cols-3 bg-neutral-100 [&_button]:!text-neutral-500 [&_button:hover]:!text-neutral-700 [&_[data-state=active]]:!bg-white [&_[data-state=active]]:!text-neutral-900 [&_[data-state=active]]:shadow-sm">
                <TabsTrigger value="wallet">Wallet</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="passkey">Passkey</TabsTrigger>
              </TabsList>
              <TabsContent value="wallet">
                <WalletTab />
              </TabsContent>
              <TabsContent value="email">
                <EmailTab />
              </TabsContent>
              <TabsContent value="passkey">
                <PasskeyTab />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
