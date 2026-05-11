import type { MenuItem, PaymentStatus } from "@/lib/types";

export const STORAGE_KEYS = {
  session: "snack_session",
  cart: "snack_cart",
  orders: "snack_orders",
  activeOrderId: "snack_active_order_id",
} as const;

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "mahtai_piroshki",
    name: "Махтай пирошки",
    subtitle: "Шүүслэг үхрийн мах, халуухан шарсан",
    price: 3500,
    kcal: 320,
    tag: "Хамгийн их авдаг",
    tone: "warm",
    image: "/img/mahtai_piroshki.jpg",
  },
  {
    id: "tomstoi_piroshki",
    name: "Төмстэй пирошки",
    subtitle: "Зөөлөн төмс, цагаан лууван, бяслаг",
    price: 3500,
    kcal: 280,
    tag: "Цагаан хоолтнуудад",
    tone: "warm",
    image: "/img/tomstoi_piroshki.jpg",
  },
  {
    id: "mantuun_buuz",
    name: "Мантуун бууз",
    subtitle: "Уурандаа жигнэсэн зөөлөн гадартай",
    price: 3500,
    kcal: 300,
    tag: "Шинэ",
    tone: "neutral",
    image: "/img/mantuun_buuz.jpg",
  },
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
  classNumber: "302",
  names: ["Hurgelt hun", "HurgeltiinHun"],
} as const;
