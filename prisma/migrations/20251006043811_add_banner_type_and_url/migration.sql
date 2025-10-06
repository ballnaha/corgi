-- AlterTable
ALTER TABLE `banners` ADD COLUMN `banner_type` VARCHAR(191) NOT NULL DEFAULT 'custom',
    ADD COLUMN `banner_url` VARCHAR(191) NULL;
