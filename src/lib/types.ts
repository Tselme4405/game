export type UserRole = "student" | "teacher" | "admin";
export type EntryRole = Exclude<UserRole, "admin">;
export type Role = UserRole;
export type BonumEnvironment = "test" | "production";

export type PaymentStatus = "draft" | "pending" | "approved" | "rejected";

export type Session = {
  role: UserRole;
  name: string;
  classNumber?: string;
};

export type MenuItem = {
  id: string;
  name: string;
  subtitle: string;
  price: number;
};

export type Cart = {
  items: Record<string, number>;
  totalCount: number;
  updatedAt: string;
};

export type OrderItem = {
  itemId: string;
  name: string;
  qty: number;
};

export type OrderRecord = {
  id: string;
  userName: string;
  classNumber?: string;
  role: UserRole;
  items: OrderItem[];
  totalCount: number;
  status: PaymentStatus;
  createdAt: string;
  // Bonum payment tracking (optional — only set when paid via QR)
  bonumInvoiceId?: string;
  bonumTransactionId?: string;
  bonumPaidAt?: string;
};
