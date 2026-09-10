/*
  Warnings:

  - A unique constraint covering the columns `[resetToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `resetToken` VARCHAR(191) NULL,
    ADD COLUMN `resetTokenExpiry` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `password_reset_requests` (
    `id` VARCHAR(191) NOT NULL,
    `userEmail` VARCHAR(191) NOT NULL,
    `userName` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'RESOLVED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `resolvedById` VARCHAR(191) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,

    INDEX `password_reset_requests_status_idx`(`status`),
    INDEX `password_reset_requests_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `users_resetToken_key` ON `users`(`resetToken`);

-- AddForeignKey
ALTER TABLE `password_reset_requests` ADD CONSTRAINT `password_reset_requests_resolvedById_fkey` FOREIGN KEY (`resolvedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
