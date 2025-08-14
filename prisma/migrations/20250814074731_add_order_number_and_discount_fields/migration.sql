-- AlterTable
ALTER TABLE `orders` ADD COLUMN `discount_amount` DECIMAL(10, 2) NULL DEFAULT 0,
    ADD COLUMN `discount_code` VARCHAR(191) NULL,
    ADD COLUMN `order_number` VARCHAR(191) NOT NULL DEFAULT '';
