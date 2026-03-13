"use client";

import { embeddedPasskeyMessageSchema } from "@loyal-labs/auth-core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuthApiClient, useAuthSession } from "@/contexts/auth-session-context";
import { useSignInModal } from "@/contexts/sign-in-modal-context";
import { AuthApiClientError } from "@/lib/auth/client";

type EmbeddedPasskeyStep =
  | "idle"
  | "starting"
  | "iframe"
  | "completing"
  | "error";

function toTrustedOrigin(iframeUrl: string): string | null {
  try {
    return new URL(iframeUrl, window.location.origin).origin;
  } catch {
    return null;
  }
}

export function useEmbeddedPasskeySignIn({
  onFlowStart,
}: {
  onFlowStart?: () => void;
}) {
  const authApiClient = useAuthApiClient();
  const { refreshSession } = useAuthSession();
  const { close } = useSignInModal();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [step, setStep] = useState<EmbeddedPasskeyStep>("idle");
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState<string[]>([]);

  const trustedOrigin = useMemo(
    () => (iframeUrl ? toTrustedOrigin(iframeUrl) : null),
    [iframeUrl]
  );

  const reset = useCallback(() => {
    setStep("idle");
    setIframeUrl(null);
    setErrorMessage("");
    setErrorDetails([]);
  }, []);

  const start = useCallback(async () => {
    setStep("starting");
    setErrorMessage("");
    setErrorDetails([]);
    onFlowStart?.();

    try {
      const nextIframeUrl = await authApiClient.startPasskeySignIn({
        metaInfo: {
          appName: "askloyal",
        },
      });
      setIframeUrl(nextIframeUrl);
      setStep("iframe");
    } catch (error) {
      const authError =
        error instanceof AuthApiClientError
          ? error
          : new AuthApiClientError("Failed to start passkey authentication.", {
              code: "passkey_sign_in_start_failed",
              status: 500,
            });

      setErrorMessage(authError.message);
      setErrorDetails(authError.details);
      setStep("error");
    }
  }, [authApiClient, onFlowStart]);

  const retry = useCallback(() => {
    reset();
    void start();
  }, [reset, start]);

  useEffect(() => {
    if (step !== "iframe" || !trustedOrigin) {
      return;
    }

    let cancelled = false;

    const handleMessage = (event: MessageEvent) => {
      if (cancelled || event.origin !== trustedOrigin) {
        return;
      }

      if (
        iframeRef.current?.contentWindow &&
        event.source !== iframeRef.current.contentWindow
      ) {
        return;
      }

      const parsed = embeddedPasskeyMessageSchema.safeParse(event.data);
      if (!parsed.success) {
        return;
      }

      if (parsed.data.type === "authz_error") {
        setErrorMessage(parsed.data.message);
        setErrorDetails(parsed.data.details);
        setStep("error");
        return;
      }

      setStep("completing");
      void refreshSession()
        .then(() => {
          if (!cancelled) {
            close();
          }
        })
        .catch((error) => {
          if (cancelled) {
            return;
          }

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Failed to refresh passkey session."
          );
          setErrorDetails([]);
          setStep("error");
        });
    };

    window.addEventListener("message", handleMessage);
    return () => {
      cancelled = true;
      window.removeEventListener("message", handleMessage);
    };
  }, [close, refreshSession, step, trustedOrigin]);

  return {
    iframeRef,
    step,
    iframeUrl,
    errorMessage,
    errorDetails,
    start,
    retry,
  };
}
