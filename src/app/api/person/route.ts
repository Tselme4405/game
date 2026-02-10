import { NextResponse } from "next/server";

import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const role = body.role as Role;
    const name = String(body.name ?? "").trim();
    const classCodeRaw = body.classCode != null ? String(body.classCode) : null;

    if (!role || !name) {
      return new NextResponse("role/name required", { status: 400 });
    }

    let classCode: string | null = null;

    if (role === "STUDENT") {
      const onlyDigits = (classCodeRaw ?? "").replace(/\D/g, "").slice(0, 3);

      if (onlyDigits.length !== 3) {
        return new NextResponse("classCode must be 3 digits", {
          status: 400,
        });
      }
      classCode = onlyDigits;
    }

    const saved = await prisma.person.create({
      data: {
        role,
        name,
        classCode,
      },
    });

    return NextResponse.json(saved);
  } catch (err) {
    console.error("API /api/person error:", err);
    return new NextResponse("Server error", { status: 500 });
  }
}
