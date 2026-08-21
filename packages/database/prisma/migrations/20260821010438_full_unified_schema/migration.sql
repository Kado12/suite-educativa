/*
  Warnings:

  - You are about to drop the column `firstName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[personId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `firstName`,
    DROP COLUMN `lastName`,
    ADD COLUMN `personId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `persons` (
    `id` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `dni` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `birthDate` DATE NULL,
    `gender` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `persons_dni_key`(`dni`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sedes` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `sedes_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `turnos` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slot1Start` VARCHAR(191) NOT NULL,
    `slot1End` VARCHAR(191) NOT NULL,
    `slot2Start` VARCHAR(191) NOT NULL,
    `slot2End` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `turnos_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `classrooms` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `sedeId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `classrooms_name_sedeId_key`(`name`, `sedeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sections` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `classroomId` VARCHAR(191) NOT NULL,
    `turnoId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `sections_classroomId_turnoId_key`(`classroomId`, `turnoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `periods` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `weeks` INTEGER NOT NULL DEFAULT 12,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `periods_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blocks` (
    `id` VARCHAR(191) NOT NULL,
    `periodId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startWeek` INTEGER NOT NULL,
    `endWeek` INTEGER NOT NULL,

    UNIQUE INDEX `blocks_periodId_name_key`(`periodId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `areas` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `areas_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `courses` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `areaId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `block_courses` (
    `id` VARCHAR(191) NOT NULL,
    `blockId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `block_courses_blockId_courseId_key`(`blockId`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `personId` VARCHAR(191) NOT NULL,
    `priority` INTEGER NOT NULL DEFAULT 5,
    `yearsExperience` INTEGER NULL,
    `notes` TEXT NULL,
    `maxSessionsPerWeek` INTEGER NULL,
    `maxSections` INTEGER NULL,

    UNIQUE INDEX `teacher_profiles_personId_key`(`personId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_courses` (
    `id` VARCHAR(191) NOT NULL,
    `teacherProfileId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `teacher_courses_teacherProfileId_courseId_key`(`teacherProfileId`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_turnos` (
    `id` VARCHAR(191) NOT NULL,
    `teacherProfileId` VARCHAR(191) NOT NULL,
    `turnoId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `teacher_turnos_teacherProfileId_turnoId_key`(`teacherProfileId`, `turnoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_sedes` (
    `id` VARCHAR(191) NOT NULL,
    `teacherProfileId` VARCHAR(191) NOT NULL,
    `sedeId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `teacher_sedes_teacherProfileId_sedeId_key`(`teacherProfileId`, `sedeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_sede_days` (
    `id` VARCHAR(191) NOT NULL,
    `teacherProfileId` VARCHAR(191) NOT NULL,
    `sedeId` VARCHAR(191) NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,

    UNIQUE INDEX `teacher_sede_days_teacherProfileId_sedeId_dayOfWeek_key`(`teacherProfileId`, `sedeId`, `dayOfWeek`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_slot_prefs` (
    `id` VARCHAR(191) NOT NULL,
    `teacherProfileId` VARCHAR(191) NOT NULL,
    `turnoId` VARCHAR(191) NOT NULL,
    `slot` INTEGER NOT NULL,

    UNIQUE INDEX `teacher_slot_prefs_teacherProfileId_turnoId_slot_key`(`teacherProfileId`, `turnoId`, `slot`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_unavailable_days` (
    `id` VARCHAR(191) NOT NULL,
    `teacherProfileId` VARCHAR(191) NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,

    UNIQUE INDEX `teacher_unavailable_days_teacherProfileId_dayOfWeek_key`(`teacherProfileId`, `dayOfWeek`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `enrollments` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NOT NULL,
    `periodId` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'TRANSFERRED', 'WITHDRAWN') NOT NULL DEFAULT 'ACTIVE',
    `enrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_plans` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `installments` INTEGER NOT NULL DEFAULT 1,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `payment_plans_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(191) NOT NULL,
    `enrollmentId` VARCHAR(191) NOT NULL,
    `paymentPlanId` VARCHAR(191) NULL,
    `installment` INTEGER NOT NULL DEFAULT 1,
    `amount` DECIMAL(10, 2) NOT NULL,
    `dueDate` DATE NOT NULL,
    `paidDate` DATE NULL,
    `paidAmount` DECIMAL(10, 2) NULL,
    `status` ENUM('PENDING', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `schedule_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `teacherProfileId` VARCHAR(191) NOT NULL,
    `blockId` VARCHAR(191) NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,
    `slot` INTEGER NOT NULL,

    UNIQUE INDEX `schedule_sessions_sectionId_dayOfWeek_slot_key`(`sectionId`, `dayOfWeek`, `slot`),
    UNIQUE INDEX `schedule_sessions_teacherProfileId_dayOfWeek_slot_key`(`teacherProfileId`, `dayOfWeek`, `slot`),
    UNIQUE INDEX `schedule_sessions_sectionId_courseId_blockId_key`(`sectionId`, `courseId`, `blockId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance_records` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `status` ENUM('PRESENT', 'ABSENT') NOT NULL,
    `lateMinutes` INTEGER NOT NULL DEFAULT 0,
    `notes` VARCHAR(191) NULL,

    UNIQUE INDEX `attendance_records_sessionId_date_key`(`sessionId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `week_validations` (
    `id` VARCHAR(191) NOT NULL,
    `teacherProfileId` VARCHAR(191) NOT NULL,
    `periodId` VARCHAR(191) NOT NULL,
    `weekNumber` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'VALIDATED', 'OBSERVED') NOT NULL DEFAULT 'PENDING',
    `comment` VARCHAR(191) NULL,
    `validatedById` VARCHAR(191) NULL,

    UNIQUE INDEX `week_validations_teacherProfileId_periodId_weekNumber_key`(`teacherProfileId`, `periodId`, `weekNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `users_personId_key` ON `users`(`personId`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `persons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classrooms` ADD CONSTRAINT `classrooms_sedeId_fkey` FOREIGN KEY (`sedeId`) REFERENCES `sedes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sections` ADD CONSTRAINT `sections_classroomId_fkey` FOREIGN KEY (`classroomId`) REFERENCES `classrooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sections` ADD CONSTRAINT `sections_turnoId_fkey` FOREIGN KEY (`turnoId`) REFERENCES `turnos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blocks` ADD CONSTRAINT `blocks_periodId_fkey` FOREIGN KEY (`periodId`) REFERENCES `periods`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `courses_areaId_fkey` FOREIGN KEY (`areaId`) REFERENCES `areas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `block_courses` ADD CONSTRAINT `block_courses_blockId_fkey` FOREIGN KEY (`blockId`) REFERENCES `blocks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `block_courses` ADD CONSTRAINT `block_courses_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_profiles` ADD CONSTRAINT `teacher_profiles_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `persons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_courses` ADD CONSTRAINT `teacher_courses_teacherProfileId_fkey` FOREIGN KEY (`teacherProfileId`) REFERENCES `teacher_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_courses` ADD CONSTRAINT `teacher_courses_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_turnos` ADD CONSTRAINT `teacher_turnos_teacherProfileId_fkey` FOREIGN KEY (`teacherProfileId`) REFERENCES `teacher_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_turnos` ADD CONSTRAINT `teacher_turnos_turnoId_fkey` FOREIGN KEY (`turnoId`) REFERENCES `turnos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_sedes` ADD CONSTRAINT `teacher_sedes_teacherProfileId_fkey` FOREIGN KEY (`teacherProfileId`) REFERENCES `teacher_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_sedes` ADD CONSTRAINT `teacher_sedes_sedeId_fkey` FOREIGN KEY (`sedeId`) REFERENCES `sedes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_sede_days` ADD CONSTRAINT `teacher_sede_days_teacherProfileId_fkey` FOREIGN KEY (`teacherProfileId`) REFERENCES `teacher_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_sede_days` ADD CONSTRAINT `teacher_sede_days_sedeId_fkey` FOREIGN KEY (`sedeId`) REFERENCES `sedes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_slot_prefs` ADD CONSTRAINT `teacher_slot_prefs_teacherProfileId_fkey` FOREIGN KEY (`teacherProfileId`) REFERENCES `teacher_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_slot_prefs` ADD CONSTRAINT `teacher_slot_prefs_turnoId_fkey` FOREIGN KEY (`turnoId`) REFERENCES `turnos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_unavailable_days` ADD CONSTRAINT `teacher_unavailable_days_teacherProfileId_fkey` FOREIGN KEY (`teacherProfileId`) REFERENCES `teacher_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `persons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `sections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_periodId_fkey` FOREIGN KEY (`periodId`) REFERENCES `periods`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `enrollments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_paymentPlanId_fkey` FOREIGN KEY (`paymentPlanId`) REFERENCES `payment_plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schedule_sessions` ADD CONSTRAINT `schedule_sessions_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `sections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schedule_sessions` ADD CONSTRAINT `schedule_sessions_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schedule_sessions` ADD CONSTRAINT `schedule_sessions_teacherProfileId_fkey` FOREIGN KEY (`teacherProfileId`) REFERENCES `teacher_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schedule_sessions` ADD CONSTRAINT `schedule_sessions_blockId_fkey` FOREIGN KEY (`blockId`) REFERENCES `blocks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `schedule_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `week_validations` ADD CONSTRAINT `week_validations_teacherProfileId_fkey` FOREIGN KEY (`teacherProfileId`) REFERENCES `teacher_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `week_validations` ADD CONSTRAINT `week_validations_periodId_fkey` FOREIGN KEY (`periodId`) REFERENCES `periods`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `week_validations` ADD CONSTRAINT `week_validations_validatedById_fkey` FOREIGN KEY (`validatedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
