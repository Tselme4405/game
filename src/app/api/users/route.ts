import { NextResponse } from "next/server";
import { insertUser, type UserRole } from "@/lib/server/neon";

function parseRole(value: unknown): UserRole | null {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "student" || normalized === "teacher" || normalized === "admin") {
    return normalized;
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body.name ?? "").trim();
    const role = parseRole(body.role ?? "student");
    const classNumberRaw = body.class_number ?? body.classNumber ?? null;
    const classNumber = classNumberRaw == null ? null : String(classNumberRaw).trim();

    if (!name) {
      return new NextResponse("name required", { status: 400 });
    }

    if (!role) {
      return new NextResponse("role must be student/teacher/admin", {
        status: 400,
      });
    }

    if ((role === "student" || role === "admin") && !classNumber) {
      return new NextResponse("class_number required", { status: 400 });
    }

    const saved = await insertUser({
      name,
      role,
      classNumber,
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("API /api/users error:", error);
    return new NextResponse("Server error", { status: 500 });
  }
}
