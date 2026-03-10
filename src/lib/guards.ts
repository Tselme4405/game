import { ADMIN_STUDENT, DELIVERY_TEACHER } from "@/lib/constants";
import type { Session } from "@/lib/types";

export function isAdminSession(
  session: Session | null,
): boolean {
  return (
    session?.role === "admin" ||
    (session?.role === "student" &&
      session.name === ADMIN_STUDENT.name &&
      session.classNumber === ADMIN_STUDENT.classNumber)
  );
}

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
    !!session.classNumber?.trim() &&
    !isAdminSession(session)
  );
}
