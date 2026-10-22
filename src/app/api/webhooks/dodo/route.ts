import { NextResponse, type NextRequest } from "next/server";
import { handleWebhook } from "@/lib/payments/dodo";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headers = {
    "webhook-id": req.headers.get("webhook-id") ?? "",
    "webhook-signature": req.headers.get("webhook-signature") ?? "",
    "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
  };
  try {
    const outcome = await handleWebhook(body, headers);
    return NextResponse.json({ ok: true, outcome });
  } catch (err) {
    console.error("[dodo webhook]", err);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
