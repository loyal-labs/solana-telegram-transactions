const DEFAULT_NON_INTERACTIVE_MESSAGE =
  "Session is missing or invalid. Run bun run auth:bootstrap to re-authenticate.";

export type NonInteractiveAuthCallbacks = {
  code: () => Promise<string>;
  password: () => Promise<string>;
  phone: () => Promise<string>;
};

export function createNonInteractiveAuthCallbacks(
  message: string = DEFAULT_NON_INTERACTIVE_MESSAGE
): NonInteractiveAuthCallbacks {
  const throwAuthError = async (): Promise<string> => {
    throw new Error(message);
  };

  return {
    code: throwAuthError,
    password: throwAuthError,
    phone: throwAuthError,
  };
}
