import { verify } from "@noble/ed25519";
import { NextResponse } from "next/server";

import { TELEGRAM_PUBLIC_KEYS } from "@/lib/constants";
import { createInvoiceLink } from "@/lib/telegram/bot-api/create-invoice-link";
import { createValidationBytesFromRawInitData } from "@/lib/telegram/mini-app/init-data-transform";

const textDecoder = new TextDecoder();

const verifyInitData = async (
  validationBytes: Uint8Array,
  signatureBytes: Uint8Array
): Promise<boolean> => {
  if (validationBytes.length === 0 || signatureBytes.length !== 64) {
    return false;
  }

  const results = await Promise.all(
    TELEGRAM_PUBLIC_KEYS.map(async (publicKeyHex) => {
      try {
        const publicKeyBytes = Buffer.from(publicKeyHex, "hex");
        if (publicKeyBytes.length !== 32) {
          return false;
        }
        return verify(signatureBytes, validationBytes, publicKeyBytes);
      } catch (error) {
        console.error("[telegram][invoice] failed to verify init data", error);
        return false;
      }
    })
  );

  return results.some(Boolean);
};

export async function POST(req: Request) {
  try {
    const body = await req.arrayBuffer();
    if (!body || body.byteLength === 0) {
      return NextResponse.json(
        { error: "initData bytes are required" },
        { status: 400 }
      );
    }

    const initData = textDecoder.decode(body);
    if (!initData) {
      return NextResponse.json({ error: "initData is empty" }, { status: 400 });
    }

    let validationBytes: Uint8Array;
    let signatureBytes: Uint8Array;
    try {
      ({ validationBytes, signatureBytes } =
        createValidationBytesFromRawInitData(initData));
    } catch (error) {
      console.error("[telegram][invoice] failed to parse initData", error);
      return NextResponse.json(
        { error: "Invalid initData payload" },
        { status: 400 }
      );
    }

    const isValid = await verifyInitData(validationBytes, signatureBytes);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid Telegram init data" },
        { status: 401 }
      );
    }

    const invoiceLink = await createInvoiceLink();

    return NextResponse.json({ invoiceLink });
  } catch (error) {
    console.error("[telegram][invoice] failed to create invoice link", error);
    return NextResponse.json(
      { error: "Failed to create invoice link" },
      { status: 500 }
    );
  }
}
