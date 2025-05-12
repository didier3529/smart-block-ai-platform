import { NextRequest, NextResponse } from "next/server";
import { generateNonce } from "@/lib/utils/crypto";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { error: "Address is required" },
      { status: 400 }
    );
  }

  const nonce = generateNonce();
  const message = `Sign this message to authenticate with Smart Block AI\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;

  return NextResponse.json({ message, nonce });
} 