import { isTMA } from "@telegram-apps/bridge";
import {
  init,
  miniApp,
  openTelegramLink,
  requestContact,
  RequestedContact,
  sendData,
  viewport,
} from "@telegram-apps/sdk-react";

// Initialize once
let initialized = false;

export const initTelegram = () => {
  if (initialized) return;

  try {
    if (isTMA()) {
      init();
      miniApp.ready();

      // Safely mount viewport to prevent null errors
      if (viewport.mount.isAvailable()) {
        try {
          viewport.mount();
        } catch (e) {
          // Suppress viewport mounting errors in dev environment
          console.debug("Viewport mount skipped:", (e as Error).message);
        }
      }
    } else {
      // Running outside Telegram - features will be unavailable
      console.debug("Running in non-Telegram environment");
    }
  } catch (e) {
    console.warn("Telegram SDK initialization skipped:", (e as Error).message);
  } finally {
    initialized = true;
  }
};

// Core functions
export const isInMiniApp = () => {
  if (typeof window === "undefined") return false;

  // Initialize if not already done
  initTelegram();

  // Check if miniApp is available after init
  return miniApp.isSupported();
};

export const requestTelegramContact = async (): Promise<RequestedContact> => {
  if (!requestContact.isAvailable()) throw new Error("Not available");

  return await requestContact();
};

export const openTgLink = (link: string) => {
  if (!openTelegramLink.isAvailable()) {
    throw new Error("Not available");
  }

  openTelegramLink(link);
};

export const sendString = (data: string) => {
  if (sendData.isAvailable()) {
    sendData(data);

    return true;
  }

  return false;
};

export type { RequestedContact };
