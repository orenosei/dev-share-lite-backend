/*
  Warnings:

  - Made the column `address` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `avatarUrl` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bio` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `firstName` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lastName` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "avatarUrl" SET NOT NULL,
ALTER COLUMN "bio" SET NOT NULL,
ALTER COLUMN "firstName" SET NOT NULL,
ALTER COLUMN "lastName" SET NOT NULL,
ALTER COLUMN "phone" SET NOT NULL;
