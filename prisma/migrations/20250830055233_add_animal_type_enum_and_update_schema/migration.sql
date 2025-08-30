-- AlterTable
ALTER TABLE `categories` ADD COLUMN `animal_type` ENUM('DOG', 'CAT', 'BIRD', 'FISH', 'RABBIT', 'HAMSTER', 'REPTILE', 'SMALL_PET', 'GENERAL') NOT NULL DEFAULT 'GENERAL';

-- AlterTable
ALTER TABLE `products` ADD COLUMN `animal_type` ENUM('DOG', 'CAT', 'BIRD', 'FISH', 'RABBIT', 'HAMSTER', 'REPTILE', 'SMALL_PET', 'GENERAL') NOT NULL DEFAULT 'GENERAL';

-- CreateIndex
CREATE INDEX `categories_animal_type_idx` ON `categories`(`animal_type`);

-- CreateIndex
CREATE INDEX `products_animal_type_idx` ON `products`(`animal_type`);
