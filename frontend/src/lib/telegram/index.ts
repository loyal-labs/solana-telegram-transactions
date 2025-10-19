import {
  RequestedContact,
  init,
  miniApp,
  openTelegramLink,
  requestContact,
  sendData,
} from "@telegram-apps/sdk-react";
import { isTMA } from "@telegram-apps/bridge";

// Initialize once
let initialized = false;

export const initTelegram = () => {
  if (!initialized && isTMA()) {
    try {
      init();
      miniApp.ready();
      initialized = true;
    } catch (e) {
      console.error(e);
    }
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
