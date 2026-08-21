-- AlterTable
ALTER TABLE `audit_logs` ADD COLUMN `userEmail` VARCHAR(191) NULL,
    ADD COLUMN `userName` VARCHAR(191) NULL;
