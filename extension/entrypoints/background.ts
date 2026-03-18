import type {
  SignTransactionRequest,
  SignTransactionResponse,
} from "~/src/lib/external-wallet-signer";
import {
  activeWalletSource,
  connectedExternalWallet,
} from "~/src/lib/storage";

// Track the connect tab so we can route signing requests to it
let connectTabId: number | null = null;

// Pending sign requests: id -> sendResponse callback
const pendingSignRequests = new Map<
  string,
  (response: SignTransactionResponse) => void
>();

export default defineBackground(() => {
  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  // Clean up tracked tab when it closes
  browser.tabs.onRemoved.addListener((tabId) => {
    if (tabId === connectTabId) {
      connectTabId = null;
    }
  });

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // --- Wallet connection from connect tab ---
    if (message.type === "WALLET_CONNECTED" && message.publicKey) {
      connectTabId = sender.tab?.id ?? null;
      void connectedExternalWallet.setValue(message.publicKey);
      void activeWalletSource.setValue("external");
      return;
    }

    // --- Sign request from popup/sidepanel ---
    if (message.type === "SIGN_TRANSACTION") {
      const request = message as SignTransactionRequest;

      if (connectTabId === null) {
        sendResponse({
          type: "SIGN_TRANSACTION_RESPONSE",
          id: request.id,
          error:
            "No wallet tab connected. Open the connect page and link your wallet first.",
        } satisfies SignTransactionResponse);
        return;
      }

      // Store the callback so we can resolve when the tab responds
      pendingSignRequests.set(request.id, sendResponse);

      // Forward to the connect tab
      browser.tabs
        .sendMessage(connectTabId, request)
        .catch((err: unknown) => {
          pendingSignRequests.delete(request.id);
          sendResponse({
            type: "SIGN_TRANSACTION_RESPONSE",
            id: request.id,
            error:
              err instanceof Error
                ? err.message
                : "Failed to reach wallet tab",
          } satisfies SignTransactionResponse);
        });

      // Return true to indicate we will call sendResponse asynchronously
      return true;
    }

    // --- Sign response from connect tab ---
    if (message.type === "SIGN_TRANSACTION_RESPONSE") {
      const response = message as SignTransactionResponse;
      const pending = pendingSignRequests.get(response.id);
      if (pending) {
        pendingSignRequests.delete(response.id);
        pending(response);
      }
      return;
    }
  });
});
