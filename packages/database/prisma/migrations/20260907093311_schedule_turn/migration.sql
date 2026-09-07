-- AddForeignKey
ALTER TABLE `schedule_sessions` ADD CONSTRAINT `schedule_sessions_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `sections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
