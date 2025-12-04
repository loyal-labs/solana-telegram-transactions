import { on } from "@telegram-apps/bridge";
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

  on(
    "invoice_closed",
    (payload) => {
      console.log("Invoice closed event:", payload);
    },
    true
  );

  await invoice.open(invoiceUrl, "url");
};
