import { NextRequest, NextResponse } from "next/server";
import { createBonumQr, getBonumEnvironment, getBonumToken } from "@/lib/bonum";

function isLocalHost(host: string | null) {
  if (!host) return false;

  const normalized = host.toLowerCase();

  return (
    normalized.startsWith("localhost:") ||
    normalized === "localhost" ||
    normalized.startsWith("127.0.0.1:") ||
    normalized === "127.0.0.1" ||
    normalized.startsWith("[::1]:") ||
    normalized === "[::1]"
  );
}

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
    const environment = getBonumEnvironment();

    if (environment === "test" && !isLocalHost(req.headers.get("host"))) {
      return NextResponse.json(
        {
          environment,
          error:
            "Bonum sandbox credential ashiglagdaj baina. Public site deer live bank app esvel QR unshuulj tuluh bolomjgui. Production App Secret, Terminal ID, BONUM_BASE_URL=https://apis.bonum.mn heregtei.",
        },
        { status: 409 }
      );
    }

    const token = await getBonumToken();
    const qr = await createBonumQr(token, { amount, transactionId });
    const expiresIn =
      typeof qr.expiresIn === "number" && Number.isFinite(qr.expiresIn) && qr.expiresIn > 0
        ? qr.expiresIn
        : 1800;

    return NextResponse.json({
      success: true,
      environment,
      transactionId,
      invoiceId: qr.invoiceId,
      qrCode: qr.qrCode,
      qrImage: qr.qrImage,
      links: qr.links,
      expiresIn,
      expiresAt: qr.expiresAt ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[bonum/create-qr]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
