import { NextResponse } from "next/server";
import { normalizeSessionName, validateClassNumber, validateSessionName } from "@/lib/session-validation";
import { insertUser, type UserRole } from "@/lib/server/neon";

function parseRole(value: unknown): UserRole | null {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (normalized === "student" || normalized === "teacher") {
    return normalized;
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = normalizeSessionName(String(body.name ?? ""));
    const role = parseRole(body.role);
    const classNumberRaw =
      body.class_number ?? body.classNumber ?? body.classCode ?? null;
    const classNumber =
      classNumberRaw == null ? null : String(classNumberRaw).trim();
    const nameError = validateSessionName(name);
    const classNumberError = role === "student" ? validateClassNumber(classNumber ?? "") : "";

    if (nameError) {
      return new NextResponse(nameError, { status: 400 });
    }

    if (!role) {
      return new NextResponse("role must be student/teacher", {
        status: 400,
      });
    }

    if (classNumberError) {
      return new NextResponse(classNumberError, { status: 400 });
    }

    const saved = await insertUser({
      name,
      role,
      classNumber,
    });

    return NextResponse.json(saved);
  } catch (err) {
    console.error("API /api/person error:", err);
    return new NextResponse("Server error", { status: 500 });
  }
}
