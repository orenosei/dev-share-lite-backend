/*
  Warnings:

  - You are about to drop the column `alt` on the `PostImage` table. All the data in the column will be lost.
  - You are about to drop the column `filename` on the `PostImage` table. All the data in the column will be lost.
  - You are about to drop the column `format` on the `PostImage` table. All the data in the column will be lost.
  - You are about to drop the column `height` on the `PostImage` table. All the data in the column will be lost.
  - You are about to drop the column `isMain` on the `PostImage` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `PostImage` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `PostImage` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedBy` on the `PostImage` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `PostImage` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PostImage" DROP CONSTRAINT "PostImage_uploadedBy_fkey";

-- DropIndex
DROP INDEX "PostImage_createdAt_idx";

-- DropIndex
DROP INDEX "PostImage_isMain_idx";

-- DropIndex
DROP INDEX "PostImage_uploadedBy_idx";

-- AlterTable
ALTER TABLE "PostImage" DROP COLUMN "alt",
DROP COLUMN "filename",
DROP COLUMN "format",
DROP COLUMN "height",
DROP COLUMN "isMain",
DROP COLUMN "size",
DROP COLUMN "updatedAt",
DROP COLUMN "uploadedBy",
DROP COLUMN "width";
