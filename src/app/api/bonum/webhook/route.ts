import { NextRequest, NextResponse } from "next/server";
import { findAppOrderByInvoiceId, markBonumPaid, updateAppOrderStatus } from "@/lib/server/neon";

// Temporary: confirms the route is reachable — remove after testing
export async function GET() {
  return NextResponse.json({ ok: true, method: "GET" });
}

export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log("[bonum/webhook] received:", JSON.stringify(payload, null, 2));

  // TODO: Verify Bonum request signature once Bonum provides the webhook secret.
  // Read the raw body before JSON.parse, then HMAC-SHA256 it with BONUM_WEBHOOK_SECRET
  // and compare to req.headers.get("X-Bonum-Signature"). Return 401 on mismatch.

  const data = payload as Record<string, unknown>;
  const invoiceId = typeof data.invoiceId === "string" ? data.invoiceId : null;
  const status = typeof data.status === "string" ? data.status : null;

  if (!invoiceId) {
    console.warn("[bonum/webhook] missing invoiceId in payload");
    return NextResponse.json({ received: true });
  }

  const order = await findAppOrderByInvoiceId(invoiceId);

  if (!order) {
    console.warn("[bonum/webhook] no order found for invoiceId:", invoiceId);
    // Return 200 so Bonum stops retrying — this invoice is unknown to us
    return NextResponse.json({ received: true });
  }

  if (status === "SUCCESS") {
    await markBonumPaid(invoiceId);
    console.log("[bonum/webhook] order", order.id, "marked as approved");
  } else if (status === "FAILED" || status === "EXPIRED") {
    await updateAppOrderStatus(order.id, "rejected");
    console.log("[bonum/webhook] order", order.id, "marked as rejected, status:", status);
  } else {
    console.log("[bonum/webhook] unhandled status:", status, "for order:", order.id);
  }

  // Always return 200 — any other status causes Bonum to retry
  return NextResponse.json({ received: true });
}
