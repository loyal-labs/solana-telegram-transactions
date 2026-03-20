import type {
  SignTransactionRequest,
  SignTransactionResponse,
} from "~/src/lib/external-wallet-signer";
import {
  activeWalletSource,
  autoLockTimeout,
  connectedExternalWallet,
  isWalletUnlocked,
  lastActivityAt,
} from "~/src/lib/storage";

// Track the connect tab so we can route signing requests to it
let connectTabId: number | null = null;

// Pending sign requests: id -> sendResponse callback
const pendingSignRequests = new Map<
  string,
  (response: SignTransactionResponse) => void
>();

const LOCK_ALARM = "auto-lock-check";

async function checkAutoLock() {
  const [unlocked, timeout, lastActive] = await Promise.all([
    isWalletUnlocked.getValue(),
    autoLockTimeout.getValue(),
    lastActivityAt.getValue(),
  ]);
  if (!unlocked || timeout === 0 || lastActive === 0) return;
  const elapsed = Date.now() - lastActive;
  if (elapsed >= timeout * 60_000) {
    await isWalletUnlocked.setValue(false);
  }
}

export default defineBackground(() => {
  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  // --- Auto-lock: periodic alarm check ---
  browser.alarms.create(LOCK_ALARM, { periodInMinutes: 1 });
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === LOCK_ALARM) void checkAutoLock();
  });

  // --- Auto-lock: system idle / screen lock ---
  browser.idle.setDetectionInterval(60);
  browser.idle.onStateChanged.addListener((state) => {
    if (state === "locked") {
      void isWalletUnlocked.setValue(false);
    } else if (state === "idle") {
      void checkAutoLock();
    }
  });

  // --- Auto-lock: activity heartbeat from UI ---
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === "ACTIVITY_HEARTBEAT") {
      void lastActivityAt.setValue(Date.now());
      return;
    }
  });

  // Clean up tracked tab and reject pending sign requests when it closes
  browser.tabs.onRemoved.addListener((tabId) => {
    if (tabId === connectTabId) {
      connectTabId = null;
      for (const [id, resolve] of pendingSignRequests) {
        resolve({
          type: "SIGN_TRANSACTION_RESPONSE",
          id,
          error: "Wallet tab was closed before signing completed.",
        } satisfies SignTransactionResponse);
        pendingSignRequests.delete(id);
      }
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
