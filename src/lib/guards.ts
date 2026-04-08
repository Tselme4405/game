import { DELIVERY_TEACHER } from "@/lib/constants";
import type { Session } from "@/lib/types";

export function isDeliverySession(
  session: Session | null,
): session is Session & { role: "teacher" } {
  return session?.role === "teacher" && session.name === DELIVERY_TEACHER.name;
}

export function isNormalStudentSession(
  session: Session | null,
): session is Session & { role: "student"; classNumber: string } {
  return (
    session?.role === "student" &&
    !!session.classNumber?.trim()
  );
}
