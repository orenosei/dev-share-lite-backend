-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" JSON,
ADD COLUMN     "avatarUrl" VARCHAR(255),
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "firstName" VARCHAR(50),
ADD COLUMN     "lastName" VARCHAR(50),
ADD COLUMN     "phone" VARCHAR(20);
