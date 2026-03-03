"use client";

import { ConnectBox, usePhantom } from "@phantom/react-sdk";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthCallbackPage() {
  const { isConnected, isLoading } = usePhantom();
  const router = useRouter();

  useEffect(() => {
    if (isConnected && !isLoading) {
      router.push("/");
    }
  }, [isConnected, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-6">
        <h1 className="font-medium text-white text-xl">
          Connecting to Phantom...
        </h1>
        <ConnectBox maxWidth="400px" />
      </div>
    </div>
  );
}
