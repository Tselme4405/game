import { NextResponse } from "next/server";
import { findAppOrderById } from "@/lib/server/neon";

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

    return NextResponse.json(order);
  } catch (error) {
    console.error("API /api/orders/[id] GET error:", error);
    return new NextResponse("Server error", { status: 500 });
  }
}
