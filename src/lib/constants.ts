import type { MenuItem, PaymentStatus } from "@/lib/types";

export const STORAGE_KEYS = {
  session: "snack_session",
  cart: "snack_cart",
  orders: "snack_orders",
  activeOrderId: "snack_active_order_id",
} as const;

export const MENU_ITEMS: MenuItem[] = [
  { id: "mahtai_piroshki", name: "Махтай пирошки", subtitle: "Сонгоод тоо оруулна", price: 3500 },
  { id: "tomstoi_piroshki", name: "Төмстэй пирошки", subtitle: "Сонгоод тоо оруулна", price: 3500 },
  { id: "mantuun_buuz", name: "Мантуун бууз", subtitle: "Сонгоод тоо оруулна", price: 3500 },
];

export const CLASS_OPTIONS = [
  { value: "301", label: "301" },
  { value: "302", label: "302" },
  { value: "303", label: "303" },
  { value: "304", label: "304" },
  { value: "305", label: "305" },
  { value: "401", label: "401" },
  { value: "402", label: "402" },
  { value: "403", label: "403" },
  { value: "Багш", label: "Багш" },
] as const;

export const STATUS_LABELS: Record<PaymentStatus, string> = {
  draft: "Ноорог",
  pending: "Хүлээгдэж буй",
  approved: "Зөвшөөрөгдсөн",
  rejected: "Үгүйсгэсэн",
};

export const DELIVERY_ACCESS = {
  classNumber: "333",
  names: ["Hurgelt hun", "HurgeltiinHun"],
} as const;
