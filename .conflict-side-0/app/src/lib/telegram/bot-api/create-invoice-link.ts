import { getBot } from "./bot";

export const createInvoiceLink = async (): Promise<string> => {
  const bot = await getBot();

  const invoiceLink = await bot.api.createInvoiceLink(
    "Cover Transaction Fee",
    "Top up your gasless transaction deposit",
    "gasess_transaction",
    "",
    "XTR",
    [
      {
        label: "Transaction Fee Cover",
        amount: 5,
      },
    ]
  );

  return invoiceLink;
};
