import { Suspense } from "react";

import { PasskeyFlowClient } from "@/components/passkey-flow-client";

export default function CreatePage() {
  return (
    <Suspense fallback={<p>Loading passkey create flow...</p>}>
      <PasskeyFlowClient mode="create" />
    </Suspense>
  );
}
