-- AlterTable
ALTER TABLE `orders` ADD COLUMN `payment_method` VARCHAR(191) NULL,
    ADD COLUMN `payment_method_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `orders_payment_method_id_fkey` ON `orders`(`payment_method_id`);

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_payment_method_id_fkey` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
