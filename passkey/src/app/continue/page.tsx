import { Suspense } from "react";

import { PasskeyContinueClient } from "@/components/passkey-continue-client";

export default function ContinuePage() {
  return (
    <Suspense fallback={<p>Loading passkey continue flow...</p>}>
      <PasskeyContinueClient />
    </Suspense>
  );
}
