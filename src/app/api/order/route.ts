import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import type { Role } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const role = body.role as Role;
    const name = String(body.name ?? "").trim();
    const classCode = body.classCode ? String(body.classCode) : null;

    const mahtaiQty = Number(body.mahtaiQty ?? 0);
    const tomstoiQty = Number(body.tomstoiQty ?? 0);
    const mantuuQty = Number(body.mantuuQty ?? 0);

    if (!role || !name)
      return new NextResponse("role/name required", { status: 400 });

    const saved = await prisma.order.create({
      data: {
        role,
        name,
        classCode: role === "STUDENT" ? classCode : null,
        mahtaiQty,
        tomstoiQty,
        mantuuQty,
      },
    });

    return NextResponse.json(saved);
  } catch (e) {
    console.error(e);
    return new NextResponse("Server error", { status: 500 });
  }
}
