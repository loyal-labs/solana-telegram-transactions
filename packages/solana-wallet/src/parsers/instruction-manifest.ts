import bs58 from "bs58";

import type { ProgramActionType } from "../types";

const PROGRAM_ACTION_DISCRIMINATORS = new Map<string, ProgramActionType>([
  ["dc1ccfeb00eac1f6", "store"],
  ["d1a2b9b005db8edb", "verify_telegram_init_data"],
  ["ab415de13d6d1fe3", "initialize_deposit"],
  ["7dff4dc64be2555b", "initialize_username_deposit"],
  ["934deb7e48b61e0c", "claim_username_deposit_to_deposit"],
  ["141493df293fcc6f", "transfer_deposit"],
  ["e0e4bceae8994b60", "transfer_to_username_deposit"],
  ["beb61aa49cdd0800", "create_permission"],
  ["8289937939d96628", "create_username_permission"],
  ["5a934bb255580489", "delegate"],
  ["1a5204b0dd4054b2", "delegate_username_deposit"],
  ["8394b4c65b682aee", "undelegate"],
  ["a983b861dabe8604", "undelegate_username_deposit"],
]);

const MODIFY_BALANCE_DISCRIMINATOR = "94e807f037337973";

const getDiscriminatorKey = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

export type DecodedInstruction =
  | { type: "program_action"; action: ProgramActionType }
  | { type: "modify_balance"; increase: boolean };

export function decodeWalletInstruction(
  encodedData: string
): DecodedInstruction | null {
  try {
    const bytes = bs58.decode(encodedData);
    if (bytes.length < 8) {
      return null;
    }

    const discriminator = getDiscriminatorKey(bytes.subarray(0, 8));

    if (discriminator === MODIFY_BALANCE_DISCRIMINATOR) {
      return {
        type: "modify_balance",
        increase: bytes[16] === 1,
      };
    }

    const action = PROGRAM_ACTION_DISCRIMINATORS.get(discriminator);
    if (!action) {
      return null;
    }

    return { type: "program_action", action };
  } catch {
    return null;
  }
}
