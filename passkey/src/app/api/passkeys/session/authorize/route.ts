import { createPasskeyCorsRouteHandlers } from "@/lib/passkeys/cors-route";

const handlers = createPasskeyCorsRouteHandlers("authorizeSession");

export const OPTIONS = handlers.OPTIONS;
export const POST = handlers.POST;
