import { proxyPasskeyOperation } from "@/lib/passkeys/grid-proxy";

export async function POST(request: Request) {
  return proxyPasskeyOperation({
    operation: "findAccount",
    request,
  });
}
