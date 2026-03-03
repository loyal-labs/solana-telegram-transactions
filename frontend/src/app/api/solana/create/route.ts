import { NextResponse } from "next/server";

import { createSignInData } from "@/lib/solana/sign-in";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const signInData = await createSignInData();
    return NextResponse.json(signInData);
  } catch (error) {
    console.error("Failed to create Solana sign-in payload", error);
    return NextResponse.json(
      { error: "Failed to create sign-in payload" },
      { status: 500 }
    );
  }
}
