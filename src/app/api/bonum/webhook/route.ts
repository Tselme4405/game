import { NextRequest, NextResponse } from "next/server";
import {
  createBonumWebhookEvent,
  findAppOrderByInvoiceId,
  findAppOrderByTransactionId,
  markBonumPaid,
  updateAppOrderStatus,
} from "@/lib/server/neon";

// Temporary: confirms the route is reachable — remove after testing
export async function GET() {
  return NextResponse.json({ ok: true, method: "GET" });
}

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as AnyRecord)
    : null;
}

function pickString(record: AnyRecord | null, keys: string[]) {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function pickBoolean(record: AnyRecord | null, keys: string[]) {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") {
      return value;
    }
  }

  return null;
}

function normalizeBonumStatus(
  status: string | null,
  successFlag: boolean | null,
) {
  const normalized = status?.trim().toUpperCase() ?? null;

  if (
    normalized === "SUCCESS" ||
    normalized === "PAID" ||
    normalized === "APPROVED" ||
    normalized === "COMPLETED"
  ) {
    return "approved" as const;
  }

  if (
    normalized === "FAILED" ||
    normalized === "EXPIRED" ||
    normalized === "CANCELLED" ||
    normalized === "CANCELED" ||
    normalized === "REJECTED" ||
    normalized === "VOIDED"
  ) {
    return "rejected" as const;
  }

  if (successFlag === true) {
    return "approved" as const;
  }

  if (successFlag === false) {
    return "rejected" as const;
  }

  return null;
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
  //dgbfgbfyby

  const root = asRecord(payload);
  const data = asRecord(root?.data);
  const result = asRecord(root?.result);
  const body = asRecord(root?.body);

  const invoiceId =
    pickString(root, ["invoiceId", "invoice_id"]) ??
    pickString(data, ["invoiceId", "invoice_id"]) ??
    pickString(result, ["invoiceId", "invoice_id"]) ??
    pickString(body, ["invoiceId", "invoice_id"]);

  const transactionId =
    pickString(root, [
      "transactionId",
      "transaction_id",
      "merchant_order_id",
      "merchantOrderId",
      "order_id",
      "orderId",
    ]) ??
    pickString(data, [
      "transactionId",
      "transaction_id",
      "merchant_order_id",
      "merchantOrderId",
      "order_id",
      "orderId",
    ]) ??
    pickString(result, [
      "transactionId",
      "transaction_id",
      "merchant_order_id",
      "merchantOrderId",
      "order_id",
      "orderId",
    ]) ??
    pickString(body, [
      "transactionId",
      "transaction_id",
      "merchant_order_id",
      "merchantOrderId",
      "order_id",
      "orderId",
    ]);

  const status =
    pickString(root, ["status", "paymentStatus", "payment_status"]) ??
    pickString(data, ["status", "paymentStatus", "payment_status"]) ??
    pickString(result, ["status", "paymentStatus", "payment_status"]) ??
    pickString(body, ["status", "paymentStatus", "payment_status"]);

  const successFlag =
    pickBoolean(root, ["success"]) ??
    pickBoolean(data, ["success"]) ??
    pickBoolean(result, ["success"]) ??
    pickBoolean(body, ["success"]);

  const normalizedStatus = normalizeBonumStatus(status, successFlag);

  console.log("[bonum/webhook] normalized:", {
    invoiceId,
    transactionId,
    rawStatus: status,
    successFlag,
    normalizedStatus,
  });

  if (!invoiceId && !transactionId) {
    console.warn("[bonum/webhook] missing invoiceId/transactionId in payload");
    await createBonumWebhookEvent({
      rootStatus: status,
      bodyStatus: pickString(body, ["status", "invoiceStatus"]),
      action: "missing-identifiers",
    });
    return NextResponse.json({ received: true });
  }

  const order =
    (invoiceId ? await findAppOrderByInvoiceId(invoiceId) : null) ??
    (transactionId ? await findAppOrderByTransactionId(transactionId) : null);

  if (!order) {
    console.warn("[bonum/webhook] no order found for identifiers:", {
      invoiceId,
      transactionId,
    });
    await createBonumWebhookEvent({
      invoiceId,
      transactionId,
      rootStatus: status,
      bodyStatus: pickString(body, ["status", "invoiceStatus"]),
      action: "order-not-found",
    });
    // Return 200 so Bonum stops retrying — this invoice is unknown to us
    return NextResponse.json({ received: true });
  }

  if (normalizedStatus === "approved") {
    if (order.bonumInvoiceId) {
      await markBonumPaid(order.bonumInvoiceId);
    } else {
      await updateAppOrderStatus(order.id, "approved");
    }
    await createBonumWebhookEvent({
      invoiceId,
      transactionId,
      rootStatus: status,
      bodyStatus: pickString(body, ["status", "invoiceStatus"]),
      matchedOrderId: order.id,
      action: "approved",
    });
    console.log("[bonum/webhook] order", order.id, "marked as approved");
  } else if (normalizedStatus === "rejected") {
    await updateAppOrderStatus(order.id, "rejected");
    await createBonumWebhookEvent({
      invoiceId,
      transactionId,
      rootStatus: status,
      bodyStatus: pickString(body, ["status", "invoiceStatus"]),
      matchedOrderId: order.id,
      action: "rejected",
    });
    console.log(
      "[bonum/webhook] order",
      order.id,
      "marked as rejected, status:",
      status,
    );
  } else {
    await createBonumWebhookEvent({
      invoiceId,
      transactionId,
      rootStatus: status,
      bodyStatus: pickString(body, ["status", "invoiceStatus"]),
      matchedOrderId: order.id,
      action: "unhandled",
    });
    console.log("[bonum/webhook] unhandled payload for order:", order.id, {
      invoiceId,
      transactionId,
      rawStatus: status,
      successFlag,
    });
  }

  // Always return 200 — any other status causes Bonum to retry
  return NextResponse.json({ received: true });
}
