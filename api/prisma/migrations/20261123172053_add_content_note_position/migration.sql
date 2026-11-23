-- AlterTable
ALTER TABLE `Content` ADD COLUMN `position` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Note` ADD COLUMN `position` INTEGER NOT NULL DEFAULT 0;

-- Backfill
UPDATE `Content` c
JOIN (
    SELECT `id`, ROW_NUMBER() OVER (
        PARTITION BY `studyGroupId`
        ORDER BY `createdAt` DESC, `id` DESC
    ) AS `position`
    FROM `Content`
    WHERE `deletedAt` IS NULL
) ranked ON ranked.`id` = c.`id`
SET c.`position` = ranked.`position`;

UPDATE `Note` n
JOIN (
    SELECT `id`, ROW_NUMBER() OVER (
        PARTITION BY `contentId`
        ORDER BY `createdAt` DESC, `id` DESC
    ) AS `position`
    FROM `Note`
    WHERE `deletedAt` IS NULL
) ranked ON ranked.`id` = n.`id`
SET n.`position` = ranked.`position`;

-- CreateIndex
CREATE INDEX `Content_studyGroupId_position_idx` ON `Content`(`studyGroupId`, `position`);

-- CreateIndex
CREATE INDEX `Note_contentId_position_idx` ON `Note`(`contentId`, `position`);
