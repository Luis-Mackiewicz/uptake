-- DropTable
DROP TABLE `Review`;

-- DropTable
DROP TABLE `StudyCycleItem`;

-- Delete previous cycles before adding required relations
DELETE FROM `StudyCycle`;

-- AlterTable
ALTER TABLE `StudyCycle`
    ADD COLUMN `examId` INTEGER NOT NULL,
    ADD COLUMN `studyGroupId` INTEGER NOT NULL,
    ADD COLUMN `priority` INTEGER NOT NULL DEFAULT 2,
    ADD COLUMN `position` INTEGER NOT NULL DEFAULT 1,
    ADD UNIQUE INDEX `StudyCycle_examId_priority_position_key`(`examId`, `priority`, `position`),
    ADD INDEX `StudyCycle_examId_deletedAt_idx`(`examId`, `deletedAt`),
    ADD INDEX `StudyCycle_studyGroupId_idx`(`studyGroupId`);

-- CreateTable
CREATE TABLE `ExamContent` (
    `examId` INTEGER NOT NULL,
    `contentId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ExamContent_contentId_idx`(`contentId`),
    PRIMARY KEY (`examId`, `contentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudyCycleContent` (
    `cycleId` INTEGER NOT NULL,
    `contentId` INTEGER NOT NULL,
    `position` INTEGER NOT NULL,
    `minutesPerSession` INTEGER NOT NULL DEFAULT 25,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `StudyCycleContent_cycleId_position_key`(`cycleId`, `position`),
    INDEX `StudyCycleContent_contentId_idx`(`contentId`),
    PRIMARY KEY (`cycleId`, `contentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StudyCycle` ADD CONSTRAINT `StudyCycle_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `Exam`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudyCycle` ADD CONSTRAINT `StudyCycle_studyGroupId_fkey` FOREIGN KEY (`studyGroupId`) REFERENCES `StudyGroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamContent` ADD CONSTRAINT `ExamContent_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `Exam`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamContent` ADD CONSTRAINT `ExamContent_contentId_fkey` FOREIGN KEY (`contentId`) REFERENCES `Content`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudyCycleContent` ADD CONSTRAINT `StudyCycleContent_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `StudyCycle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudyCycleContent` ADD CONSTRAINT `StudyCycleContent_contentId_fkey` FOREIGN KEY (`contentId`) REFERENCES `Content`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
