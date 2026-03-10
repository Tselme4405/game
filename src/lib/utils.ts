export function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Тодорхойгүй";
  }

  return new Intl.DateTimeFormat("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function buildId() {
  return `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
