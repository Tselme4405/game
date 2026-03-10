import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/lib/types";
export type { UserRole } from "@/lib/types";

type UserRow = {
  id: bigint | number;
  name: string;
  class_number: string | null;
  role: UserRole;
  created_at: Date;
};

type OrderRow = {
  id: bigint | number;
  user_id: bigint | number;
  item_name: string;
  quantity: number;
  created_at: Date;
};

function normalizeId(id: bigint | number): number {
  return typeof id === "bigint" ? Number(id) : id;
}

export async function ensureNeonTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      class_number TEXT,
      role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS orders (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function insertUser(input: {
  name: string;
  classNumber: string | null;
  role: UserRole;
}) {
  await ensureNeonTables();

  const rows = await prisma.$queryRaw<UserRow[]>`
    INSERT INTO users (name, class_number, role)
    VALUES (${input.name}, ${input.classNumber}, ${input.role})
    RETURNING id, name, class_number, role, created_at
  `;

  const row = rows[0];

  return {
    id: normalizeId(row.id),
    name: row.name,
    class_number: row.class_number,
    role: row.role,
    created_at: row.created_at,
  };
}

export async function insertOrder(input: {
  userId: number;
  itemName: string;
  quantity: number;
}) {
  await ensureNeonTables();

  const rows = await prisma.$queryRaw<OrderRow[]>`
    INSERT INTO orders (user_id, item_name, quantity)
    VALUES (${input.userId}, ${input.itemName}, ${input.quantity})
    RETURNING id, user_id, item_name, quantity, created_at
  `;

  const row = rows[0];

  return {
    id: normalizeId(row.id),
    user_id: normalizeId(row.user_id),
    item_name: row.item_name,
    quantity: row.quantity,
    created_at: row.created_at,
  };
}
