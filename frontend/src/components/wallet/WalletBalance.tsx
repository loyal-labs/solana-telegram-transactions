"use client";

import { Badge, Cell, Info } from "@telegram-apps/telegram-ui";
import { type ReactNode } from "react";

export type WalletBalanceProps = {
  /**
   * The primary balance amount shown in the cell's trailing info block.
   * Defaults to the mocked SOL balance.
   */
  amount?: ReactNode;
  /**
   * Fiat representation rendered as the subtitle of the trailing info block.
   * Defaults to the mocked USD equivalent.
   */
  fiatAmount?: string;
};

export default function WalletBalance({
  amount = "1 SOL",
  fiatAmount = "$300.00",
}: WalletBalanceProps) {
  return (
    <Cell
      after={
        <Info subtitle={fiatAmount} type="text">
          {amount}
        </Info>
      }
      interactiveAnimation="opacity"
      titleBadge={<Badge type="dot" />}
    >
      Balance
    </Cell>
  );
}
