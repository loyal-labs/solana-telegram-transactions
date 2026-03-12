import { Suspense } from "react";

import { PasskeyContinueClient } from "@/components/passkey-continue-client";
import { ShieldSpinner } from "@/components/shield-spinner";

export default function ContinuePage() {
  return (
    <Suspense fallback={<ShieldSpinner />}>
      <PasskeyContinueClient />
    </Suspense>
  );
}
