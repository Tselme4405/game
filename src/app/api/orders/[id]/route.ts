import { NextResponse } from "next/server";
import { hasBonumMerchantKey, readBonumPaymentLog } from "@/lib/bonum";
import { findAppOrderById, markBonumPaid, updateAppOrderStatus } from "@/lib/server/neon";
import type { OrderRecord } from "@/lib/types";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const orderId = String(id ?? "").trim();

    if (!orderId) {
      return new NextResponse("id required", { status: 400 });
    }

    const order = await findAppOrderById(orderId);

    if (!order) {
      return new NextResponse("order not found", { status: 404 });
    }

    const syncedOrder = await syncPendingOrderWithBonum(order);

    return NextResponse.json(syncedOrder);
  } catch (error) {
    console.error("API /api/orders/[id] GET error:", error);
    return new NextResponse("Server error", { status: 500 });
  }
}

async function syncPendingOrderWithBonum(order: OrderRecord) {
  if (
    order.status !== "pending" ||
    !order.bonumTransactionId ||
    !hasBonumMerchantKey()
  ) {
    return order;
  }

  try {
    const paymentLogs = await readBonumPaymentLog(order.bonumTransactionId);
    const latestResult = [...paymentLogs]
      .filter((entry) => typeof entry.success === "boolean")
      .sort((left, right) => {
        const leftTime = Date.parse(left.createdAt ?? "");
        const rightTime = Date.parse(right.createdAt ?? "");

        return (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0);
      })[0];

    if (!latestResult || typeof latestResult.success !== "boolean") {
      return order;
    }

    if (latestResult.success === true) {
      if (order.bonumInvoiceId) {
        return (await markBonumPaid(order.bonumInvoiceId)) ?? order;
      }

      return (await updateAppOrderStatus(order.id, "approved")) ?? order;
    }

    return (await updateAppOrderStatus(order.id, "rejected")) ?? order;
  } catch (error) {
    console.error("[orders/:id] Bonum fallback verification failed:", error);
    return order;
  }
}
