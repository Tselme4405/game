const NAME_PATTERN = /^[\p{L}\s]+$/u;
const CLASS_NUMBER_PATTERN = /^\d{3}$/;

export function normalizeSessionName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function sanitizeClassNumberInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 3);
}

export function validateSessionName(value: string) {
  const normalized = normalizeSessionName(value);

  if (!normalized) {
    return "Нэрээ оруулна уу";
  }

  if (!NAME_PATTERN.test(normalized)) {
    return "Нэр дээр зөвхөн үсэг бичнэ үү";
  }

  return "";
}

export function validateClassNumber(value: string) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return "Ангийн дугаараа оруулна уу";
  }

  if (!CLASS_NUMBER_PATTERN.test(normalized)) {
    return "Анги 3 оронтой тоо байна. Жишээ: 302";
  }

  return "";
}
