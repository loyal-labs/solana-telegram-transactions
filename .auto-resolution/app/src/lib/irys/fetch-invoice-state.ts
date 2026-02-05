import { fetchFromIrys } from "@/lib/irys/irys-fetch";
import { queryTransactionsByTag } from "@/lib/irys/irys-query";

import { GaslessInvoice } from "./types";

const isValidSolanaAddress = (address: string): boolean => {
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
};

export const fetchInvoiceState = async (
  walletAddress: string
): Promise<GaslessInvoice> => {
  if (!isValidSolanaAddress(walletAddress)) {
    throw new Error("Invalid wallet address");
  }

  const invoices = await queryTransactionsByTag(
    "wallet-address",
    walletAddress
  );

  if (invoices.length === 0) {
    return {
      remainingStars: 0,
    };
  }
  const invoice = invoices[0];
  const invoiceId = invoice.id;
  const invoiceData = await fetchFromIrys(invoiceId);

  try {
    const invoiceJson = JSON.parse(invoiceData);
    const remainingStars = Number(invoiceJson.remainingStars);
    return {
      remainingStars: remainingStars,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log("Error parsing invoice data. Error: ", error.message);
    } else {
      console.log("Error parsing invoice data. Unknown error: ", error);
    }

    return {
      remainingStars: 0,
    };
  }
};
