-- AlterTable
ALTER TABLE "ShareLink" ADD COLUMN     "downloadCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxDownloads" INTEGER;
