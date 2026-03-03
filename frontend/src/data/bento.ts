export type BentoItemVisualKey =
  | "cardOne"
  | "cardTwo"
  | "cardThree"
  | "cardFour"
  | "cardFive"
  | "cardFiveApp"
  | "cardSix"
  | "cardSeven"
  | "cardEight"
  | "cardNine";

export type BentoItemCopy = {
  visualKey: BentoItemVisualKey;
  title: string;
  description: string;
};

export type BentoTabContent = {
  label: string;
  items: BentoItemCopy[];
};

const sectionOneItems: BentoItemCopy[] = [
  {
    visualKey: "cardOne",
    title: "Sensitive data protected",
    description:
      "Summarize Telegram chats, run branded agents, process & talk to sensitive documents.",
  },
  {
    visualKey: "cardTwo",
    title: "Private transactions",
    description:
      "Automate onchain workflows without leaving a trace. Powered by Arcium.",
  },
  {
    visualKey: "cardThree",
    title: "Automated workflows",
    description:
      "Supercharge your wallets and save time with automated workflows.",
  },
  {
    visualKey: "cardFour",
    title: "Hands-off repetitive tasks",
    description:
      "Loyal makes sending money, paying invoices and managing your assets easy.",
  },
  {
    visualKey: "cardFiveApp",
    title: "User-owned storage",
    description: "Your wallet = your data",
  },
];

const sectionTwoItems: BentoItemCopy[] = [
  {
    visualKey: "cardSix",
    title: "Per-query micropayments",
    description: "Pay for what you use, no upfront costs.",
  },
  {
    visualKey: "cardSeven",
    title: "Data ownership",
    description:
      "Your data, your rules. No third parties, no centralization. No one can take it away.",
  },
  {
    visualKey: "cardEight",
    title: "Telegram private payments",
    description:
      "Transfer Solana tokens using Telegram handles, no need for a wallet. Completely private and anonymous.",
  },
  {
    visualKey: "cardNine",
    title: "Workflow builder & executor",
    description:
      "Help your sales team stay on top of messages, help your community builders with branded agents and conversation analytics.",
  },
  {
    visualKey: "cardFive",
    title: "Solana-native interoperability",
    description:
      "Call Loyal agents from your own smart contracts and automate your entire stack.",
  },
];

export const bentoTabs: BentoTabContent[] = [
  { label: "Applications", items: sectionOneItems },
  { label: "Infrastructure", items: sectionTwoItems },
];
