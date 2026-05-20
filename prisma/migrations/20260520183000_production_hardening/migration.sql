ALTER TABLE `payment_webhook_events`
    ADD COLUMN `attemptCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `processingStartedAt` DATETIME(3) NULL,
    ADD COLUMN `lastAttemptAt` DATETIME(3) NULL,
    ADD COLUMN `lastError` LONGTEXT NULL;

UPDATE `payment_webhook_events`
SET
    `attemptCount` = CASE
        WHEN `attemptCount` < 1 THEN 1
        ELSE `attemptCount`
    END,
    `processingStartedAt` = COALESCE(`processingStartedAt`, `updatedAt`, `createdAt`),
    `lastAttemptAt` = COALESCE(`lastAttemptAt`, `updatedAt`, `createdAt`),
    `lastError` = CASE
        WHEN `status` = 'FAILED' AND `lastError` IS NULL THEN 'Legacy failed event without persisted error context.'
        ELSE `lastError`
    END;

CREATE TEMPORARY TABLE `_duplicate_course_enrollments` (
    `id` VARCHAR(191) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB;

INSERT INTO `_duplicate_course_enrollments` (`id`)
SELECT `id`
FROM (
    SELECT
        `id`,
        ROW_NUMBER() OVER (
            PARTITION BY `userId`, `courseId`
            ORDER BY
                CASE `status`
                    WHEN 'ACTIVE' THEN 0
                    WHEN 'CANCELLED' THEN 1
                    WHEN 'REVOKED' THEN 2
                    WHEN 'EXPIRED' THEN 3
                    ELSE 4
                END,
                CASE
                    WHEN `purchaseId` IS NULL THEN 1
                    ELSE 0
                END,
                `updatedAt` DESC,
                `createdAt` DESC,
                `id` DESC
        ) AS `row_num`
    FROM `CourseEnrollment`
) AS `ranked_enrollments`
WHERE `row_num` > 1;

DELETE FROM `CourseEnrollment`
WHERE `id` IN (
    SELECT `id`
    FROM `_duplicate_course_enrollments`
);

DROP TEMPORARY TABLE `_duplicate_course_enrollments`;

ALTER TABLE `CourseEnrollment`
    ADD CONSTRAINT `CourseEnrollment_userId_courseId_key` UNIQUE (`userId`, `courseId`);
