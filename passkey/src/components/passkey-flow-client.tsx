"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { startTransition, useState } from "react";

import {
  buildGridAuthUrl,
  extractGridErrorMessage,
  parseGridErrorDetails,
} from "@loyal-labs/grid-core";
import {
  buildPasskeyFlowRequest,
  parsePasskeyFlowQuery,
  type PasskeyFlowMode,
} from "@/lib/passkeys/flow-runner";
import { isChallengeTimeoutError } from "@/lib/passkeys/webauthn";

async function callLocalPasskeyApi(endpoint: string, payload: unknown) {
  const response = await fetch(buildGridAuthUrl("", endpoint), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const bodyText = await response.text();
  let body: unknown = bodyText;
  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    body = bodyText;
  }

  return { ok: response.ok, status: response.status, body };
}

export function PasskeyFlowClient({ mode }: { mode: PasskeyFlowMode }) {
  const searchParams = useSearchParams();
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [result, setResult] = useState<unknown>(null);
  const [isChallengeExpired, setIsChallengeExpired] = useState(false);

  const parsed = parsePasskeyFlowQuery(mode, searchParams);

  async function runFlow() {
    if (!parsed.ok || isRunning) {
      return;
    }

    setIsRunning(true);
    setErrorMessage(null);
    setErrorDetails([]);
    setIsChallengeExpired(false);
    startTransition(() => setResult(null));

    try {
      const request = await buildPasskeyFlowRequest(mode, parsed.data);
      const outcome = await callLocalPasskeyApi(request.endpoint, request.payload);
      if (!outcome.ok) {
        const details = parseGridErrorDetails(outcome.body);
        if (details.length > 0) {
          setErrorDetails(details);
        }
        throw new Error(extractGridErrorMessage(outcome.body));
      }

      startTransition(() => setResult(outcome.body));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Passkey flow failed";
      setErrorMessage(message);
      setIsChallengeExpired(isChallengeTimeoutError(error));
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <section>
      <h1 style={{ fontSize: 26, marginBottom: 8 }}>
        {mode === "create" ? "Create Passkey Account" : "Authorize Passkey Session"}
      </h1>
      <p style={{ lineHeight: 1.5, marginBottom: 18 }}>
        {mode === "create"
          ? "Completes WebAuthn passkey registration and submits the create session."
          : "Completes WebAuthn authentication and submits the passkey session."}
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
          onClick={runFlow}
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
          {isRunning
            ? "Running WebAuthn ceremony..."
            : mode === "create"
              ? "Create with Passkey"
              : "Authenticate with Passkey"}
        </button>
      )}

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
              Challenge likely expired. Restart from the session create/authorize
              step and retry immediately.
            </p>
          ) : null}
        </div>
      ) : null}

      {result ? (
        <pre
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            overflowX: "auto",
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}

      <p style={{ marginTop: 18 }}>
        <Link href="/">Back to workspace home</Link>
      </p>
    </section>
  );
}
