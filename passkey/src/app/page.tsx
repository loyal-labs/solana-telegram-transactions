import Link from "next/link";
import type { CSSProperties } from "react";

const cardStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
  background: "#f8fafc",
};

export default function HomePage() {
  return (
    <main>
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>Passkey Proxy Workspace</h1>
      <p style={{ lineHeight: 1.5, marginBottom: 20 }}>
        This app owns the Squads Grid passkey WebAuthn proxy flow on a custom
        domain.
      </p>

      <section style={cardStyle}>
        <h2 style={{ fontSize: 18, marginTop: 0 }}>Flow Pages</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li>
            <Link href="/create">/create</Link>
          </li>
          <li>
            <Link href="/auth">/auth</Link>
          </li>
        </ul>
      </section>

      <section style={cardStyle}>
        <h2 style={{ fontSize: 18, marginTop: 0 }}>API Endpoints</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 1.5 }}>
          <li>POST /api/passkeys/session/create</li>
          <li>POST /api/passkeys/session/authorize</li>
          <li>POST /api/passkeys/session/submit</li>
          <li>POST /api/passkeys/account/create</li>
          <li>POST /api/passkeys/account/find</li>
          <li>GET /api/passkeys/account/:passkeyAddress</li>
        </ul>
      </section>
    </main>
  );
}
