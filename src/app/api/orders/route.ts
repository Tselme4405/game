import { NextResponse } from "next/server";
import { insertOrder } from "@/lib/server/neon";

export async function POST(req: Request) {
  try {
    const body = await req.json();

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
    console.error("API /api/orders error:", error);
    return new NextResponse("Server error", { status: 500 });
  }
}
