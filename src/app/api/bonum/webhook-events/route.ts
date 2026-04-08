import { NextResponse } from "next/server";
import { listBonumWebhookEvents } from "@/lib/server/neon";

export async function GET() {
  try {
    const events = await listBonumWebhookEvents(25);
    return NextResponse.json(events);
  } catch (error) {
    console.error("API /api/bonum/webhook-events GET error:", error);
    return new NextResponse("Server error", { status: 500 });
  }
}
