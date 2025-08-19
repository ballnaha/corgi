/*
  Warnings:

  - You are about to drop the column `status` on the `payment_notifications` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `payment_notifications` DROP COLUMN `status`;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `brand` VARCHAR(191) NULL,
    ADD COLUMN `dimensions` VARCHAR(191) NULL,
    ADD COLUMN `material` VARCHAR(191) NULL,
    ADD COLUMN `model` VARCHAR(191) NULL,
    ADD COLUMN `product_type` ENUM('PET', 'FOOD', 'TOY', 'ACCESSORY', 'MEDICINE', 'GROOMING', 'HOUSING', 'OTHER') NOT NULL DEFAULT 'OTHER',
    ADD COLUMN `size` VARCHAR(191) NULL,
    ADD COLUMN `weight_grams` INTEGER NULL,
    MODIFY `vaccinated` BOOLEAN NULL,
    MODIFY `certified` BOOLEAN NULL;

-- CreateTable
CREATE TABLE `banners` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `subtitle` VARCHAR(191) NULL,
    `image_url` VARCHAR(191) NOT NULL,
    `image_alt` VARCHAR(191) NOT NULL,
    `background` VARCHAR(191) NOT NULL,
    `link_url` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `products_product_type_idx` ON `products`(`product_type`);
