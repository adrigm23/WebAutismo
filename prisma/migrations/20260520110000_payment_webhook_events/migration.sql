CREATE TABLE `payment_webhook_events` (
    `id` VARCHAR(191) NOT NULL,
    `stripeEventId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `payloadHash` VARCHAR(191) NOT NULL,
    `status` ENUM('PROCESSING', 'PROCESSED', 'REJECTED', 'FAILED', 'IGNORED') NOT NULL,
    `processedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payment_webhook_events_stripeEventId_key`(`stripeEventId`),
    INDEX `payment_webhook_events_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
