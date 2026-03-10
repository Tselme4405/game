export type Role = "student" | "teacher";
export type SessionRole = Role | "admin";

export type PaymentStatus = "draft" | "pending" | "approved" | "rejected";

export type Session = {
  role: SessionRole;
  name: string;
  classNumber?: string;
};

export type MenuItem = {
  id: string;
  name: string;
  subtitle: string;
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
  role: Role;
  items: OrderItem[];
  totalCount: number;
  status: PaymentStatus;
  createdAt: string;
};
