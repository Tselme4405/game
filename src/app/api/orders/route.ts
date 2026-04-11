import { NextResponse } from "next/server";
import {
  deleteAppOrdersOlderThan,
  insertOrder,
  listAppOrders,
  updateAppOrderStatus,
  upsertAppOrder,
} from "@/lib/server/neon";
import type { OrderRecord, PaymentStatus, UserRole } from "@/lib/types";

const VALID_STATUSES: PaymentStatus[] = ["draft", "pending", "approved", "rejected"];
const APP_ORDER_RETENTION_DAYS = 7;

function isPaymentStatus(value: unknown): value is PaymentStatus {
  return VALID_STATUSES.includes(value as PaymentStatus);
}

function isUserRole(value: unknown): value is UserRole {
  return value === "student" || value === "teacher";
}

function parseBoundedInt(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
) {
  const parsed = Number(value ?? "");

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, Math.trunc(parsed)));
}

function parseOrderRecord(body: unknown): OrderRecord | null {
  if (!body || typeof body !== "object") return null;

  const candidate = body as Partial<OrderRecord>;

  if (!candidate.id || typeof candidate.id !== "string") return null;
  if (!candidate.userName || typeof candidate.userName !== "string") return null;
  if (!isUserRole(candidate.role)) return null;
  if (!Array.isArray(candidate.items)) return null;
  if (typeof candidate.totalCount !== "number") return null;
  if (!isPaymentStatus(candidate.status)) return null;
  if (!candidate.createdAt || typeof candidate.createdAt !== "string") return null;

  return {
    id: candidate.id,
    userName: candidate.userName.trim(),
    classNumber:
      candidate.classNumber == null ? undefined : String(candidate.classNumber).trim(),
    role: candidate.role,
    items: candidate.items
      .filter((item): item is OrderRecord["items"][number] => {
        return (
          !!item &&
          typeof item === "object" &&
          typeof item.itemId === "string" &&
          typeof item.name === "string" &&
          typeof item.qty === "number"
        );
      })
      .map((item) => ({
        itemId: item.itemId,
        name: item.name,
        qty: item.qty,
      })),
    totalCount: candidate.totalCount,
    status: candidate.status,
    createdAt: candidate.createdAt,
    bonumInvoiceId:
      typeof candidate.bonumInvoiceId === "string" ? candidate.bonumInvoiceId : undefined,
    bonumTransactionId:
      typeof candidate.bonumTransactionId === "string" ? candidate.bonumTransactionId : undefined,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const status = isPaymentStatus(statusParam) ? statusParam : undefined;
    const limit = parseBoundedInt(searchParams.get("limit"), 200, 1, 1000);
    const days = parseBoundedInt(searchParams.get("days"), 0, 0, 30);
    const cleanup = searchParams.get("cleanup") === "true";
    const createdAfter =
      days > 0 ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : undefined;

    if (cleanup && createdAfter) {
      await deleteAppOrdersOlderThan(createdAfter);
    }

    const orders = await listAppOrders({ status, limit, createdAfter });
    return NextResponse.json(orders);
  } catch (error) {
    console.error("API /api/orders GET error:", error);
    return new NextResponse("Server error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const appOrder = parseOrderRecord(body);
    if (appOrder) {
      await deleteAppOrdersOlderThan(
        new Date(Date.now() - APP_ORDER_RETENTION_DAYS * 24 * 60 * 60 * 1000),
      );
      const saved = await upsertAppOrder(appOrder);
      return NextResponse.json(saved, { status: 201 });
    }

    const userId = Number(body.user_id ?? body.userId);
    const itemName = String(body.item_name ?? body.itemName ?? "").trim();
    const quantity = Number(body.quantity ?? 0);

    if (!Number.isInteger(userId) || userId <= 0) {
      return new NextResponse("user_id must be a positive integer", {
        status: 400,
      });
    }

    if (!itemName) {
      return new NextResponse("item_name required", { status: 400 });
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return new NextResponse("quantity must be a positive integer", {
        status: 400,
      });
    }

    const saved = await insertOrder({
      userId,
      itemName,
      quantity,
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("API /api/orders POST error:", error);
    return new NextResponse("Server error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const orderId = String(body.id ?? "").trim();
    const status = body.status;

    if (!orderId) {
      return new NextResponse("id required", { status: 400 });
    }

    if (!isPaymentStatus(status)) {
      return new NextResponse("invalid status", { status: 400 });
    }

    const saved = await updateAppOrderStatus(orderId, status);
    if (!saved) {
      return new NextResponse("order not found", { status: 404 });
    }

    return NextResponse.json(saved);
  } catch (error) {
    console.error("API /api/orders PATCH error:", error);
    return new NextResponse("Server error", { status: 500 });
  }
}
