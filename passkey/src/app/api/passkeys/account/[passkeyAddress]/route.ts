import { proxyPasskeyOperation } from "@/lib/passkeys/grid-proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ passkeyAddress: string }> }
) {
  const { passkeyAddress } = await context.params;
  return proxyPasskeyOperation({
    operation: "getAccount",
    request,
    passkeyAddress,
  });
}
