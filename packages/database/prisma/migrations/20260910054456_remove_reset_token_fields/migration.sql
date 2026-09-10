/*
  Warnings:

  - You are about to drop the column `resetToken` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `resetTokenExpiry` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `users_resetToken_key` ON `users`;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `resetToken`,
    DROP COLUMN `resetTokenExpiry`;
