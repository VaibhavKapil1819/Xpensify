/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `profiles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `password_hash` to the `profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "password_hash" TEXT NOT NULL,
ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");
