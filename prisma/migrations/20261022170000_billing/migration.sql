-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTH', 'YEAR');

-- CreateEnum
CREATE TYPE "BillingOrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillingProvider" AS ENUM ('INTERNAL', 'RAZORPAY', 'STRIPE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "billingInterval" "BillingInterval",
ADD COLUMN     "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "planExpiresAt" TIMESTAMP(3),
ADD COLUMN     "planStartedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BillingOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "Plan" NOT NULL,
    "interval" "BillingInterval" NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "BillingOrderStatus" NOT NULL DEFAULT 'PENDING',
    "provider" "BillingProvider" NOT NULL DEFAULT 'INTERNAL',
    "providerOrderId" TEXT,
    "providerPaymentId" TEXT,
    "receipt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "BillingOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingOrder_providerOrderId_key" ON "BillingOrder"("providerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingOrder_providerPaymentId_key" ON "BillingOrder"("providerPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingOrder_receipt_key" ON "BillingOrder"("receipt");

-- CreateIndex
CREATE INDEX "BillingOrder_userId_createdAt_idx" ON "BillingOrder"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "BillingOrder_status_idx" ON "BillingOrder"("status");

-- AddForeignKey
ALTER TABLE "BillingOrder" ADD CONSTRAINT "BillingOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
