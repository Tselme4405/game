-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "name" TEXT NOT NULL,
    "classCode" TEXT,
    "mahtaiQty" INTEGER NOT NULL DEFAULT 0,
    "tomstoiQty" INTEGER NOT NULL DEFAULT 0,
    "mantuuQty" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
