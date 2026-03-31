import { NextRequest, NextResponse } from "next/server";
import { getBonumToken, createBonumQr } from "@/lib/bonum";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { amount } = body as { amount?: unknown };

  if (typeof amount !== "number" || amount <= 0 || !Number.isFinite(amount)) {
    return NextResponse.json(
      { error: "amount must be a positive number" },
      { status: 400 }
    );
  }

  // transactionId must be unique per Bonum's requirement
  const transactionId = `order-${Date.now()}-${crypto.randomUUID()}`;

  try {
    const token = await getBonumToken();
    const qr = await createBonumQr(token, { amount, transactionId });

    return NextResponse.json({
      success: true,
      transactionId,
      invoiceId: qr.invoiceId,
      qrCode: qr.qrCode,
      qrImage: qr.qrImage,
      links: qr.links,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[bonum/create-qr]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
