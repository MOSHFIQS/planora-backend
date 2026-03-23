/*
  Warnings:

  - You are about to drop the `payments` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('VALID', 'USED', 'CANCELED');

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_invitationId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_participationId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_userId_fkey";

-- AlterTable
ALTER TABLE "event" ADD COLUMN     "meetingLink" TEXT,
ADD COLUMN     "type" "EventType" NOT NULL DEFAULT 'ONLINE',
ALTER COLUMN "venue" DROP NOT NULL;

-- DropTable
DROP TABLE "payments";

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "transactionId" UUID NOT NULL,
    "stripeEventId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "invoiceUrl" TEXT,
    "paymentGatewayData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "participationId" TEXT,
    "invitationId" TEXT,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "participationId" TEXT,
    "qrCode" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'VALID',
    "checkedInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactionId_key" ON "payment"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_stripeEventId_key" ON "payment"("stripeEventId");

-- CreateIndex
CREATE INDEX "payment_participationId_idx" ON "payment"("participationId");

-- CreateIndex
CREATE INDEX "payment_invitationId_idx" ON "payment"("invitationId");

-- CreateIndex
CREATE INDEX "payment_transactionId_idx" ON "payment"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_participationId_key" ON "ticket"("participationId");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_qrCode_key" ON "ticket"("qrCode");

-- CreateIndex
CREATE INDEX "ticket_eventId_idx" ON "ticket"("eventId");

-- CreateIndex
CREATE INDEX "ticket_userId_idx" ON "ticket"("userId");

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "participation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "participation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
