-- AlterTable
ALTER TABLE `orders` ADD COLUMN `customer_email` VARCHAR(191) NULL,
    ADD COLUMN `customer_name` VARCHAR(191) NULL,
    ADD COLUMN `customer_phone` VARCHAR(191) NULL,
    ADD COLUMN `deposit_amount` DECIMAL(10, 2) NULL,
    ADD COLUMN `has_pets` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `payment_type` ENUM('FULL_PAYMENT', 'DEPOSIT_PAYMENT', 'REMAINING_PAYMENT') NOT NULL DEFAULT 'FULL_PAYMENT',
    ADD COLUMN `remaining_amount` DECIMAL(10, 2) NULL,
    ADD COLUMN `requires_deposit` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `shipping_address` TEXT NULL,
    ADD COLUMN `shipping_fee` DECIMAL(10, 2) NULL,
    ADD COLUMN `shipping_method` VARCHAR(191) NULL,
    ADD COLUMN `shipping_option_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `shipping_options` ADD COLUMN `for_pets_only` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `method` VARCHAR(191) NOT NULL DEFAULT 'delivery';

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_shipping_option_id_fkey` FOREIGN KEY (`shipping_option_id`) REFERENCES `shipping_options`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
