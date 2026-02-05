"use server";

import { NextResponse } from "next/server";

import { createInvoiceLink } from "@/lib/telegram/bot-api/create-invoice-link";
import { createValidationBytesFromRawInitData } from "@/lib/telegram/mini-app/init-data-transform";
import { verifyInitData } from "@/lib/telegram/mini-app/verify-init-data";

const textDecoder = new TextDecoder();

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
