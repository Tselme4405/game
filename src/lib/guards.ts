import { DELIVERY_ACCESS } from "@/lib/constants";
import { normalizeSessionName } from "@/lib/session-validation";
import type { Session } from "@/lib/types";

function matchesDeliveryName(name: string) {
  const normalized = normalizeSessionName(name).toLowerCase();

  return DELIVERY_ACCESS.names.some(
    (candidate) => normalizeSessionName(candidate).toLowerCase() === normalized,
  );
}

export function isDeliveryCredentials(name: string, classNumber?: string | null) {
  return (
    matchesDeliveryName(name) &&
    String(classNumber ?? "").trim() === DELIVERY_ACCESS.classNumber
  );
}

export function isDeliverySession(
  session: Session | null,
): session is Session & { classNumber: string } {
  return !!session && isDeliveryCredentials(session.name, session.classNumber);
}

export function isNormalStudentSession(
  session: Session | null,
): session is Session & { role: "student"; classNumber: string } {
  return (
    session?.role === "student" &&
    !!session.classNumber?.trim() &&
    !isDeliverySession(session)
  );
}
