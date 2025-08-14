-- First, update existing data to use compatible status values
UPDATE `orders` SET `status` = 'PREPARING' WHERE `status` = 'PROCESSING';

-- Drop the existing enum and recreate with new values
ALTER TABLE `orders` MODIFY COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING';

-- Update the column to use the new enum values
ALTER TABLE `orders` MODIFY COLUMN `status` ENUM('PENDING', 'CONFIRMED', 'PAYMENT_PENDING', 'PAID', 'PREPARING', 'READY_FOR_PICKUP', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING';
