-- CreateTable
CREATE TABLE "PostImage" (
    "id" SERIAL NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "publicId" VARCHAR(255) NOT NULL,
    "filename" VARCHAR(255),
    "alt" VARCHAR(255),
    "width" INTEGER,
    "height" INTEGER,
    "size" INTEGER,
    "format" VARCHAR(10),
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "postId" INTEGER NOT NULL,
    "uploadedBy" INTEGER NOT NULL,

    CONSTRAINT "PostImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostImage_postId_idx" ON "PostImage"("postId");

-- CreateIndex
CREATE INDEX "PostImage_uploadedBy_idx" ON "PostImage"("uploadedBy");

-- CreateIndex
CREATE INDEX "PostImage_createdAt_idx" ON "PostImage"("createdAt");

-- CreateIndex
CREATE INDEX "PostImage_isMain_idx" ON "PostImage"("isMain");

-- AddForeignKey
ALTER TABLE "PostImage" ADD CONSTRAINT "PostImage_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostImage" ADD CONSTRAINT "PostImage_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
