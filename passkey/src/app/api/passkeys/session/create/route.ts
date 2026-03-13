import { createPasskeyCorsRouteHandlers } from "@/lib/passkeys/cors-route";

const handlers = createPasskeyCorsRouteHandlers("createSession");

export const OPTIONS = handlers.OPTIONS;
export const POST = handlers.POST;
