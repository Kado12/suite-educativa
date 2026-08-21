-- AlterTable
ALTER TABLE `sections` ADD COLUMN `capacity` INTEGER NOT NULL DEFAULT 30,
    ADD COLUMN `enrollmentPriority` INTEGER NOT NULL DEFAULT 0;
