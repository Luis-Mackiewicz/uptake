-- AlterTable
ALTER TABLE `User`
    ADD COLUMN `firstName` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `lastName` VARCHAR(191) NOT NULL DEFAULT '';

-- Backfill
UPDATE `User`
SET
    `firstName` = CASE
        WHEN LOCATE(' ', TRIM(`name`)) > 0
        THEN SUBSTRING(TRIM(`name`), 1, LOCATE(' ', TRIM(`name`)) - 1)
        ELSE TRIM(`name`)
    END,
    `lastName` = CASE
        WHEN LOCATE(' ', TRIM(`name`)) > 0
        THEN TRIM(SUBSTRING(TRIM(`name`), LOCATE(' ', TRIM(`name`)) + 1))
        ELSE ''
    END;

-- AlterTable
ALTER TABLE `User`
    DROP COLUMN `name`,
    MODIFY COLUMN `firstName` VARCHAR(191) NOT NULL,
    MODIFY COLUMN `lastName` VARCHAR(191) NOT NULL;
