import { GridClient } from "@sqds/grid";

let cachedGridClient: GridClient | null = null;

export function getGridBrowserSdkClient(): GridClient {
  if (cachedGridClient) {
    return cachedGridClient;
  }

  // Browser helper methods below do not require live API calls.
  cachedGridClient = new GridClient({
    environment: "sandbox",
  });

  return cachedGridClient;
}

export function resetGridBrowserSdkClientForTests(): void {
  cachedGridClient = null;
}
