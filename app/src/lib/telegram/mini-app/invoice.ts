import { on } from "@telegram-apps/bridge";
import { invoice } from "@telegram-apps/sdk";

import { STARS_TO_USD } from "@/lib/constants";

import { getCloudValue, setCloudValue } from "./cloud-storage";
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

export const getPaidInvoice = async (): Promise<number> => {
  const remainingBalance = await getCloudValue("remainingBalance");
  if (!remainingBalance) return 0;
  return Number(remainingBalance);
};

export const getInvoiceSlug = async (): Promise<string> => {
  const invoiceSlug = await getCloudValue("invoiceSlug");
  if (!invoiceSlug) return "";
  return invoiceSlug as string;
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
      if (payload.status === "paid") {
        const invoiceSlug = payload.slug;
        const remainingBalance = 5 * STARS_TO_USD;
        setCloudValue("invoiceSlug", invoiceSlug);
        setCloudValue("remainingBalance", remainingBalance.toString());
      }
    },
    true
  );

  await invoice.open(invoiceUrl, "url");
};
