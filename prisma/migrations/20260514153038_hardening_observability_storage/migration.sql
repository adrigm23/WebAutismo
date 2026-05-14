-- AlterTable
ALTER TABLE `CourseMembership` ADD COLUMN `courseId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `CourseModuleProgress` ADD COLUMN `courseId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ForumAuditLog` ADD COLUMN `courseId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ForumCategory` ADD COLUMN `courseId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ForumNotification` ADD COLUMN `courseId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ForumSpace` ADD COLUMN `courseId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `emailVerifiedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `UserPasswordResetToken` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `UserPasswordResetToken_tokenHash_key`(`tokenHash`),
    INDEX `UserPasswordResetToken_userId_expiresAt_idx`(`userId`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserEmailVerificationToken` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `UserEmailVerificationToken_tokenHash_key`(`tokenHash`),
    INDEX `UserEmailVerificationToken_userId_expiresAt_idx`(`userId`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `CourseMembership_courseId_role_idx` ON `CourseMembership`(`courseId`, `role`);

-- CreateIndex
CREATE INDEX `CourseModuleProgress_userId_courseId_moduleIndex_idx` ON `CourseModuleProgress`(`userId`, `courseId`, `moduleIndex`);

-- CreateIndex
CREATE INDEX `CourseModuleProgress_userId_courseId_idx` ON `CourseModuleProgress`(`userId`, `courseId`);

-- CreateIndex
CREATE INDEX `CourseModuleProgress_courseId_idx` ON `CourseModuleProgress`(`courseId`);

-- CreateIndex
CREATE INDEX `ForumAuditLog_courseId_createdAt_idx` ON `ForumAuditLog`(`courseId`, `createdAt`);

-- CreateIndex
CREATE INDEX `ForumCategory_courseId_sortOrder_idx` ON `ForumCategory`(`courseId`, `sortOrder`);

-- CreateIndex
CREATE INDEX `ForumCategory_courseId_slug_idx` ON `ForumCategory`(`courseId`, `slug`);

-- CreateIndex
CREATE INDEX `ForumNotification_courseId_createdAt_idx` ON `ForumNotification`(`courseId`, `createdAt`);

-- CreateIndex
CREATE INDEX `ForumSpace_courseId_status_idx` ON `ForumSpace`(`courseId`, `status`);

-- AddForeignKey
ALTER TABLE `UserPasswordResetToken` ADD CONSTRAINT `UserPasswordResetToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserEmailVerificationToken` ADD CONSTRAINT `UserEmailVerificationToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseMembership` ADD CONSTRAINT `CourseMembership_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseModuleProgress` ADD CONSTRAINT `CourseModuleProgress_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumSpace` ADD CONSTRAINT `ForumSpace_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumCategory` ADD CONSTRAINT `ForumCategory_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumNotification` ADD CONSTRAINT `ForumNotification_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumAuditLog` ADD CONSTRAINT `ForumAuditLog_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

