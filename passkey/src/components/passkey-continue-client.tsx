"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { startTransition, useState } from "react";

import {
  runContinueAuthFirst,
  runCreateFallbackFromAuth,
} from "@/lib/passkeys/continue-runner";
import { parseAuthPasskeyQuery } from "@/lib/passkeys/query-params";

export function PasskeyContinueClient() {
  const searchParams = useSearchParams();
  const parsed = parseAuthPasskeyQuery(searchParams);

  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [result, setResult] = useState<unknown>(null);
  const [resultBranch, setResultBranch] = useState<"auth" | "create" | null>(
    null
  );
  const [isChallengeExpired, setIsChallengeExpired] = useState(false);
  const [showCreateCta, setShowCreateCta] = useState(false);
  const [createCtaMessage, setCreateCtaMessage] = useState<string | null>(null);

  async function handleContinue() {
    if (!parsed.ok || isRunning) {
      return;
    }

    setIsRunning(true);
    setErrorMessage(null);
    setErrorDetails([]);
    setIsChallengeExpired(false);
    setShowCreateCta(false);
    setCreateCtaMessage(null);
    startTransition(() => {
      setResult(null);
      setResultBranch(null);
    });

    const outcome = await runContinueAuthFirst(parsed.data);
    if (outcome.type === "success") {
      startTransition(() => {
        setResult(outcome.body);
        setResultBranch(outcome.branch);
      });
      setIsRunning(false);
      return;
    }

    if (outcome.type === "needs_create_cta") {
      setCreateCtaMessage(outcome.message);
      setShowCreateCta(true);
      setIsRunning(false);
      return;
    }

    setErrorMessage(outcome.message);
    setErrorDetails(outcome.details);
    setIsChallengeExpired(outcome.challengeExpired);
    setIsRunning(false);
  }

  async function handleCreateFallback() {
    if (!parsed.ok || isRunning) {
      return;
    }

    setIsRunning(true);
    setErrorMessage(null);
    setErrorDetails([]);
    setIsChallengeExpired(false);
    setShowCreateCta(false);
    setCreateCtaMessage(null);
    startTransition(() => {
      setResult(null);
      setResultBranch(null);
    });

    const outcome = await runCreateFallbackFromAuth(parsed.data);
    if (outcome.type === "success") {
      startTransition(() => {
        setResult(outcome.body);
        setResultBranch(outcome.branch);
      });
      setIsRunning(false);
      return;
    }

    if (outcome.type === "needs_create_cta") {
      setCreateCtaMessage(outcome.message);
      setShowCreateCta(true);
      setIsRunning(false);
      return;
    }

    setErrorMessage(outcome.message);
    setErrorDetails(outcome.details);
    setIsChallengeExpired(outcome.challengeExpired);
    setIsRunning(false);
  }

  return (
    <section>
      <h1 style={{ fontSize: 26, marginBottom: 8 }}>Continue with Passkey</h1>
      <p style={{ lineHeight: 1.5, marginBottom: 18 }}>
        Attempts passkey login first. If no account exists, it automatically
        falls back to account creation.
      </p>

      {!parsed.ok ? (
        <div
          style={{
            border: "1px solid #fca5a5",
            borderRadius: 10,
            background: "#fef2f2",
            padding: 14,
            marginBottom: 12,
          }}
        >
          <strong>Missing or invalid query parameters.</strong>
          <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
            {parsed.errors.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      ) : (
        <button
          type="button"
          disabled={isRunning}
          onClick={handleContinue}
          style={{
            border: "1px solid #0f172a",
            borderRadius: 10,
            background: isRunning ? "#cbd5e1" : "#0f172a",
            color: "#fff",
            fontWeight: 600,
            padding: "10px 14px",
            cursor: isRunning ? "not-allowed" : "pointer",
          }}
        >
          {isRunning ? "Running passkey flow..." : "Continue with Passkey"}
        </button>
      )}

      {showCreateCta ? (
        <div
          style={{
            border: "1px solid #fcd34d",
            borderRadius: 10,
            background: "#fffbeb",
            padding: 14,
            marginTop: 14,
          }}
        >
          <strong>Passkey login not completed.</strong>
          <p style={{ marginTop: 8 }}>
            {createCtaMessage ??
              "No existing passkey login was completed. You can register one now."}
          </p>
          <button
            type="button"
            disabled={isRunning}
            onClick={handleCreateFallback}
            style={{
              border: "1px solid #92400e",
              borderRadius: 10,
              background: isRunning ? "#fde68a" : "#f59e0b",
              color: "#111827",
              fontWeight: 600,
              padding: "10px 14px",
              cursor: isRunning ? "not-allowed" : "pointer",
            }}
          >
            {isRunning ? "Creating account..." : "Try create account"}
          </button>
        </div>
      ) : null}

      {errorMessage ? (
        <div
          style={{
            border: "1px solid #fca5a5",
            borderRadius: 10,
            background: "#fef2f2",
            padding: 14,
            marginTop: 14,
          }}
        >
          <strong>Error:</strong> {errorMessage}
          {errorDetails.length > 0 ? (
            <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
              {errorDetails.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
          {isChallengeExpired ? (
            <p style={{ marginBottom: 0 }}>
              Challenge likely expired. Restart from session authorize and retry
              immediately.
            </p>
          ) : null}
        </div>
      ) : null}

      {result ? (
        <section
          style={{
            border: "1px solid #86efac",
            borderRadius: 10,
            background: "#f0fdf4",
            padding: 14,
            marginTop: 14,
          }}
        >
          <strong>
            Success via {resultBranch === "create" ? "create fallback" : "auth"}.
          </strong>
          <pre
            style={{
              marginTop: 10,
              padding: 14,
              borderRadius: 10,
              border: "1px solid #bbf7d0",
              background: "#f8fafc",
              overflowX: "auto",
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </section>
      ) : null}

      <p style={{ marginTop: 18 }}>
        <Link href="/">Back to workspace home</Link>
      </p>
    </section>
  );
}
