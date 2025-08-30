/*
  Warnings:

  - You are about to drop the column `featured` on the `blog_posts` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `blog_posts_featured_idx` ON `blog_posts`;

-- AlterTable
ALTER TABLE `blog_posts` DROP COLUMN `featured`;
