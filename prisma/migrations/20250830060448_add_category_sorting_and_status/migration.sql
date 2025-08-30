-- AlterTable
ALTER TABLE `categories` ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `sort_order` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `categories_is_active_idx` ON `categories`(`is_active`);

-- CreateIndex
CREATE INDEX `categories_sort_order_idx` ON `categories`(`sort_order`);
