-- DropForeignKey
ALTER TABLE `schedule_sessions` DROP FOREIGN KEY `schedule_sessions_sectionId_fkey`;

-- DropForeignKey
ALTER TABLE `schedule_sessions` DROP FOREIGN KEY `schedule_sessions_teacherProfileId_fkey`;

-- DropIndex
DROP INDEX `schedule_sessions_sectionId_dayOfWeek_slot_key` ON `schedule_sessions`;

-- DropIndex
DROP INDEX `schedule_sessions_teacherProfileId_dayOfWeek_slot_key` ON `schedule_sessions`;

-- AlterTable
ALTER TABLE `schedule_sessions` ADD COLUMN `turnoId` VARCHAR(191) NULL,
    MODIFY `teacherProfileId` VARCHAR(191) NULL;

-- AddForeignKey
-- ALTER TABLE `teacher_sede_days` ADD CONSTRAINT `teacher_sede_days_teacherProfileId_fkey` FOREIGN KEY (`teacherProfileId`) REFERENCES `teacher_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schedule_sessions` ADD CONSTRAINT `schedule_sessions_teacherProfileId_fkey` FOREIGN KEY (`teacherProfileId`) REFERENCES `teacher_profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schedule_sessions` ADD CONSTRAINT `schedule_sessions_turnoId_fkey` FOREIGN KEY (`turnoId`) REFERENCES `turnos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
