/*
  Warnings:

  - You are about to drop the column `image` on the `event` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "event" DROP COLUMN "image",
ADD COLUMN     "images" TEXT[];
