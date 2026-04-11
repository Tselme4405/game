import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/lib/types";
export type { UserRole } from "@/lib/types";
import type {
  BonumWebhookEvent,
  OrderItem,
  OrderRecord,
  PaymentStatus,
} from "@/lib/types";

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

type AppOrderRow = {
  id: string;
  user_name: string;
  class_number: string | null;
  role: UserRole;
  items: unknown;
  total_count: number;
  status: PaymentStatus;
  created_at: Date;
  bonum_invoice_id: string | null;
  bonum_transaction_id: string | null;
  bonum_paid_at: Date | null;
};

type BonumWebhookEventRow = {
  id: bigint | number;
  received_at: Date;
  invoice_id: string | null;
  transaction_id: string | null;
  root_status: string | null;
  body_status: string | null;
  matched_order_id: string | null;
  action: string | null;
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

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS app_orders (
      id TEXT PRIMARY KEY,
      user_name TEXT NOT NULL,
      class_number TEXT,
      role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
      items JSONB NOT NULL,
      total_count INTEGER NOT NULL CHECK (total_count >= 0),
      status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Add Bonum payment columns to existing tables (idempotent)
  await prisma.$executeRawUnsafe(`ALTER TABLE app_orders ADD COLUMN IF NOT EXISTS bonum_invoice_id TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE app_orders ADD COLUMN IF NOT EXISTS bonum_transaction_id TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE app_orders ADD COLUMN IF NOT EXISTS bonum_paid_at TIMESTAMPTZ;`);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_app_orders_status_created_at
    ON app_orders (status, created_at DESC);
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_app_orders_bonum_invoice_unique
    ON app_orders (bonum_invoice_id)
    WHERE bonum_invoice_id IS NOT NULL;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_app_orders_bonum_transaction_unique
    ON app_orders (bonum_transaction_id)
    WHERE bonum_transaction_id IS NOT NULL;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS bonum_webhook_events (
      id BIGSERIAL PRIMARY KEY,
      received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      invoice_id TEXT,
      transaction_id TEXT,
      root_status TEXT,
      body_status TEXT,
      matched_order_id TEXT,
      action TEXT
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

export async function upsertAppOrder(input: OrderRecord) {
  await ensureNeonTables();

  const rows = await prisma.$queryRaw<AppOrderRow[]>`
    INSERT INTO app_orders (id, user_name, class_number, role, items, total_count, status, created_at, bonum_invoice_id, bonum_transaction_id)
    VALUES (
      ${input.id},
      ${input.userName},
      ${input.classNumber ?? null},
      ${input.role},
      ${JSON.stringify(input.items)}::jsonb,
      ${input.totalCount},
      ${input.status},
      ${new Date(input.createdAt)},
      ${input.bonumInvoiceId ?? null},
      ${input.bonumTransactionId ?? null}
    )
    ON CONFLICT (id) DO UPDATE SET
      user_name = EXCLUDED.user_name,
      class_number = EXCLUDED.class_number,
      role = EXCLUDED.role,
      items = EXCLUDED.items,
      total_count = EXCLUDED.total_count,
      status = EXCLUDED.status,
      bonum_invoice_id = EXCLUDED.bonum_invoice_id,
      bonum_transaction_id = EXCLUDED.bonum_transaction_id
    RETURNING id, user_name, class_number, role, items, total_count, status, created_at, bonum_invoice_id, bonum_transaction_id, bonum_paid_at
  `;

  return normalizeAppOrder(rows[0]);
}

export async function listAppOrders(options?: {
  status?: PaymentStatus;
  limit?: number;
  createdAfter?: Date;
}) {
  await ensureNeonTables();
  const safeLimit = Math.max(1, Math.min(1000, Math.trunc(options?.limit ?? 200)));
  const createdAfter = options?.createdAfter;

  if (options?.status && createdAfter) {
    const rows = await prisma.$queryRaw<AppOrderRow[]>`
      SELECT id, user_name, class_number, role, items, total_count, status, created_at, bonum_invoice_id, bonum_transaction_id, bonum_paid_at
      FROM app_orders
      WHERE status = ${options.status}
        AND created_at >= ${createdAfter}
      ORDER BY created_at DESC
      LIMIT ${safeLimit}
    `;

    return rows.map(normalizeAppOrder);
  }

  if (options?.status) {
    const rows = await prisma.$queryRaw<AppOrderRow[]>`
      SELECT id, user_name, class_number, role, items, total_count, status, created_at, bonum_invoice_id, bonum_transaction_id, bonum_paid_at
      FROM app_orders
      WHERE status = ${options.status}
      ORDER BY created_at DESC
      LIMIT ${safeLimit}
    `;

    return rows.map(normalizeAppOrder);
  }

  if (createdAfter) {
    const rows = await prisma.$queryRaw<AppOrderRow[]>`
      SELECT id, user_name, class_number, role, items, total_count, status, created_at, bonum_invoice_id, bonum_transaction_id, bonum_paid_at
      FROM app_orders
      WHERE created_at >= ${createdAfter}
      ORDER BY created_at DESC
      LIMIT ${safeLimit}
    `;

    return rows.map(normalizeAppOrder);
  }

  const rows = await prisma.$queryRaw<AppOrderRow[]>`
      SELECT id, user_name, class_number, role, items, total_count, status, created_at, bonum_invoice_id, bonum_transaction_id, bonum_paid_at
      FROM app_orders
      ORDER BY created_at DESC
      LIMIT ${safeLimit}
    `;

  return rows.map(normalizeAppOrder);
}

export async function deleteAppOrdersOlderThan(cutoff: Date) {
  await ensureNeonTables();

  const deletedCount = await prisma.$executeRaw`
    DELETE FROM app_orders
    WHERE created_at < ${cutoff}
  `;

  return deletedCount;
}

export async function findAppOrderById(orderId: string) {
  await ensureNeonTables();

  const rows = await prisma.$queryRaw<AppOrderRow[]>`
    SELECT id, user_name, class_number, role, items, total_count, status, created_at, bonum_invoice_id, bonum_transaction_id, bonum_paid_at
    FROM app_orders
    WHERE id = ${orderId}
    LIMIT 1
  `;

  return rows[0] ? normalizeAppOrder(rows[0]) : null;
}

export async function updateAppOrderStatus(orderId: string, status: PaymentStatus) {
  await ensureNeonTables();

  const rows = await prisma.$queryRaw<AppOrderRow[]>`
    UPDATE app_orders
    SET status = ${status}
    WHERE id = ${orderId}
    RETURNING id, user_name, class_number, role, items, total_count, status, created_at, bonum_invoice_id, bonum_transaction_id, bonum_paid_at
  `;

  return rows[0] ? normalizeAppOrder(rows[0]) : null;
}

export async function findAppOrderByInvoiceId(invoiceId: string) {
  await ensureNeonTables();

  const rows = await prisma.$queryRaw<AppOrderRow[]>`
    SELECT id, user_name, class_number, role, items, total_count, status, created_at, bonum_invoice_id, bonum_transaction_id, bonum_paid_at
    FROM app_orders
    WHERE bonum_invoice_id = ${invoiceId}
    LIMIT 1
  `;

  return rows[0] ? normalizeAppOrder(rows[0]) : null;
}

export async function findAppOrderByTransactionId(transactionId: string) {
  await ensureNeonTables();

  const rows = await prisma.$queryRaw<AppOrderRow[]>`
    SELECT id, user_name, class_number, role, items, total_count, status, created_at, bonum_invoice_id, bonum_transaction_id, bonum_paid_at
    FROM app_orders
    WHERE bonum_transaction_id = ${transactionId}
    LIMIT 1
  `;

  return rows[0] ? normalizeAppOrder(rows[0]) : null;
}

export async function markBonumPaid(invoiceId: string) {
  await ensureNeonTables();

  const rows = await prisma.$queryRaw<AppOrderRow[]>`
    UPDATE app_orders
    SET status = 'approved', bonum_paid_at = NOW()
    WHERE bonum_invoice_id = ${invoiceId}
    RETURNING id, user_name, class_number, role, items, total_count, status, created_at, bonum_invoice_id, bonum_transaction_id, bonum_paid_at
  `;

  return rows[0] ? normalizeAppOrder(rows[0]) : null;
}

export async function createBonumWebhookEvent(input: {
  invoiceId?: string | null;
  transactionId?: string | null;
  rootStatus?: string | null;
  bodyStatus?: string | null;
  matchedOrderId?: string | null;
  action?: string | null;
}) {
  await ensureNeonTables();

  const rows = await prisma.$queryRaw<BonumWebhookEventRow[]>`
    INSERT INTO bonum_webhook_events (
      invoice_id,
      transaction_id,
      root_status,
      body_status,
      matched_order_id,
      action
    )
    VALUES (
      ${input.invoiceId ?? null},
      ${input.transactionId ?? null},
      ${input.rootStatus ?? null},
      ${input.bodyStatus ?? null},
      ${input.matchedOrderId ?? null},
      ${input.action ?? null}
    )
    RETURNING id, received_at, invoice_id, transaction_id, root_status, body_status, matched_order_id, action
  `;

  return normalizeBonumWebhookEvent(rows[0]);
}

export async function listBonumWebhookEvents(limit = 20) {
  await ensureNeonTables();

  const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
  const rows = await prisma.$queryRaw<BonumWebhookEventRow[]>`
    SELECT id, received_at, invoice_id, transaction_id, root_status, body_status, matched_order_id, action
    FROM bonum_webhook_events
    ORDER BY received_at DESC
    LIMIT ${safeLimit}
  `;

  return rows.map(normalizeBonumWebhookEvent);
}

function normalizeAppOrder(row: AppOrderRow): OrderRecord {
  const items: OrderItem[] = Array.isArray(row.items) ? (row.items as OrderItem[]) : [];

  return {
    id: row.id,
    userName: row.user_name,
    classNumber: row.class_number ?? undefined,
    role: row.role,
    items,
    totalCount: row.total_count,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    bonumInvoiceId: row.bonum_invoice_id ?? undefined,
    bonumTransactionId: row.bonum_transaction_id ?? undefined,
    bonumPaidAt: row.bonum_paid_at?.toISOString() ?? undefined,
  };
}

function normalizeBonumWebhookEvent(
  row: BonumWebhookEventRow,
): BonumWebhookEvent {
  return {
    id: normalizeId(row.id),
    receivedAt: row.received_at.toISOString(),
    invoiceId: row.invoice_id ?? undefined,
    transactionId: row.transaction_id ?? undefined,
    rootStatus: row.root_status ?? undefined,
    bodyStatus: row.body_status ?? undefined,
    matchedOrderId: row.matched_order_id ?? undefined,
    action: row.action ?? undefined,
  };
}
