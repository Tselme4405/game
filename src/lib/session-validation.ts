import { CLASS_OPTIONS } from "@/lib/constants";

const NAME_PATTERN = /^[\p{L}\s]+$/u;
const ALLOWED_CLASS_VALUES = new Set<string>(CLASS_OPTIONS.map((option) => option.value));

export function normalizeSessionName(value: string) {
  return value.replace(/\s+/g, " ").trim();
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
    return "Ангиа сонгоно уу";
  }

  if (!ALLOWED_CLASS_VALUES.has(normalized)) {
    return "Жагсаалтаас ангиа сонгоно уу";
  }

  return "";
}
