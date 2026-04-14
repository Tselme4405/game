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
