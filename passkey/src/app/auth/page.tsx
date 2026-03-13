import { Suspense } from "react";

import { PasskeyFlowClient } from "@/components/passkey-flow-client";

export default function AuthPage() {
  return (
    <Suspense fallback={<p>Loading passkey auth flow...</p>}>
      <PasskeyFlowClient mode="auth" />
    </Suspense>
  );
}
