import { invoice } from "@telegram-apps/sdk";

import { isInMiniApp } from "./index";

const canUseInvoice = (): boolean => {
  if (!isInMiniApp()) return false;

  try {
    return invoice.isSupported();
  } catch (error) {
    console.error("Failed to check invoice support", error);
    return false;
  }
};

export const openInvoice = async (invoiceUrl: string): Promise<void> => {
  if (!canUseInvoice()) return;

  if (!invoice.open.isAvailable()) {
    console.warn("Invoice is not available in this environment");
    return;
  }

  await invoice.open(invoiceUrl, "url");
};
