-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `action` ENUM('COURSE_CREATED', 'COURSE_UPDATED', 'COURSE_CLONED', 'COURSE_TEACHER_ASSIGNED', 'COURSE_TEACHER_UNASSIGNED', 'COURSE_EDITION_TEACHER_ASSIGNED', 'COURSE_EDITION_TEACHER_UNASSIGNED', 'COURSE_ARCHIVED', 'EDITION_CREATED', 'EDITION_UPDATED', 'EDITION_CLOSED', 'USER_CREATED', 'USER_DEACTIVATED', 'USER_REACTIVATED', 'USER_ADMIN_GRANTED', 'USER_ADMIN_REVOKED', 'USER_TEACHER_GRANTED', 'USER_TEACHER_REVOKED', 'ENROLLMENT_CREATED', 'ENROLLMENT_DEACTIVATED', 'ENROLLMENT_REACTIVATED', 'PROMOTION_CREATED', 'PROMOTION_UPDATED', 'PROMOTION_ACTIVATED', 'PROMOTION_DEACTIVATED', 'PURCHASE_CREATED', 'PURCHASE_PAID', 'PURCHASE_FAILED', 'PROMOTION_APPLIED', 'NOTIFICATION_PREFERENCES_UPDATED', 'COURSE_RESOURCE_CREATED', 'COURSE_RESOURCE_UPDATED', 'COURSE_RESOURCE_DELETED', 'COURSE_RESOURCE_PUBLISHED', 'COURSE_RESOURCE_UNPUBLISHED', 'COURSE_RESOURCE_REORDERED', 'COURSE_RESOURCE_SUBMISSION_CREATED', 'COURSE_RESOURCE_SUBMISSION_UPDATED', 'COURSE_RESOURCE_SUBMISSION_REVIEWED', 'COURSE_RESOURCE_SUBMISSION_CHANGES_REQUESTED') NOT NULL,
    `entityType` ENUM('USER', 'COURSE', 'COURSE_EDITION', 'COURSE_ENROLLMENT', 'COURSE_RESOURCE', 'COURSE_RESOURCE_SUBMISSION', 'PROMOTION', 'PURCHASE', 'NOTIFICATION_PREFERENCE') NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `entityLabel` VARCHAR(191) NULL,
    `metadataJson` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_actorId_createdAt_idx`(`actorId` ASC, `createdAt` ASC),
    INDEX `AuditLog_createdAt_idx`(`createdAt` ASC),
    INDEX `AuditLog_entityType_entityId_createdAt_idx`(`entityType` ASC, `entityId` ASC, `createdAt` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Course` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `shortDescription` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NOT NULL,
    `priceInCents` INTEGER NOT NULL,
    `duration` VARCHAR(191) NOT NULL,
    `format` VARCHAR(191) NOT NULL,
    `level` VARCHAR(191) NOT NULL,
    `accentFrom` VARCHAR(191) NOT NULL,
    `accentTo` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `audienceJson` JSON NOT NULL,
    `outcomesJson` JSON NOT NULL,
    `methodologyJson` JSON NOT NULL,
    `faqJson` JSON NOT NULL,
    `seoTitle` VARCHAR(191) NOT NULL,
    `seoDescription` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `clonedFromId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Course_clonedFromId_fkey`(`clonedFromId` ASC),
    UNIQUE INDEX `Course_slug_key`(`slug` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseEdition` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `editionNumber` INTEGER NOT NULL,
    `status` ENUM('ACTIVE', 'SCHEDULED', 'CLOSED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `graceAccessDays` INTEGER NOT NULL DEFAULT 0,
    `accessUntil` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CourseEdition_courseId_editionNumber_key`(`courseId` ASC, `editionNumber` ASC),
    INDEX `CourseEdition_courseId_isActive_status_idx`(`courseId` ASC, `isActive` ASC, `status` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseEditionTeacherAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `courseEditionId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CourseEditionTeacherAssignment_courseEditionId_userId_key`(`courseEditionId` ASC, `userId` ASC),
    INDEX `CourseEditionTeacherAssignment_userId_idx`(`userId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseEnrollment` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `courseEditionId` VARCHAR(191) NULL,
    `purchaseId` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'CANCELLED', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `accessStartsAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `accessUntil` DATETIME(3) NULL,
    `deactivatedAt` DATETIME(3) NULL,
    `deactivatedById` VARCHAR(191) NULL,
    `notes` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CourseEnrollment_courseEditionId_status_idx`(`courseEditionId` ASC, `status` ASC),
    INDEX `CourseEnrollment_courseId_status_idx`(`courseId` ASC, `status` ASC),
    UNIQUE INDEX `CourseEnrollment_purchaseId_key`(`purchaseId` ASC),
    INDEX `CourseEnrollment_userId_status_idx`(`userId` ASC, `status` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseMembership` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `courseSlug` VARCHAR(191) NOT NULL,
    `role` ENUM('STUDENT', 'TEACHER', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CourseMembership_courseSlug_role_idx`(`courseSlug` ASC, `role` ASC),
    UNIQUE INDEX `CourseMembership_userId_courseSlug_key`(`userId` ASC, `courseSlug` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseModule` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `moduleKey` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NOT NULL,
    `estimatedTime` VARCHAR(191) NOT NULL,
    `resourcesSummary` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CourseModule_courseId_moduleKey_key`(`courseId` ASC, `moduleKey` ASC),
    INDEX `CourseModule_courseId_position_idx`(`courseId` ASC, `position` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseModuleProgress` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `courseSlug` VARCHAR(191) NOT NULL,
    `moduleId` VARCHAR(191) NOT NULL DEFAULT '',
    `moduleIndex` INTEGER NULL,
    `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CourseModuleProgress_courseSlug_idx`(`courseSlug` ASC),
    INDEX `CourseModuleProgress_userId_courseSlug_idx`(`userId` ASC, `courseSlug` ASC),
    UNIQUE INDEX `CourseModuleProgress_userId_courseSlug_moduleId_key`(`userId` ASC, `courseSlug` ASC, `moduleId` ASC),
    INDEX `CourseModuleProgress_userId_courseSlug_moduleIndex_idx`(`userId` ASC, `courseSlug` ASC, `moduleIndex` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseResource` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `moduleId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `type` ENUM('MATERIAL', 'EXERCISE') NOT NULL,
    `source` ENUM('FILE', 'LINK') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NULL,
    `linkUrl` VARCHAR(191) NULL,
    `storageKey` VARCHAR(191) NULL,
    `mimeType` VARCHAR(191) NULL,
    `sizeInBytes` INTEGER NULL,
    `dueAt` DATETIME(3) NULL,
    `passingScore` DOUBLE NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CourseResource_courseId_isPublished_sortOrder_createdAt_idx`(`courseId` ASC, `isPublished` ASC, `sortOrder` ASC, `createdAt` ASC),
    INDEX `CourseResource_createdById_createdAt_idx`(`createdById` ASC, `createdAt` ASC),
    INDEX `CourseResource_moduleId_sortOrder_idx`(`moduleId` ASC, `sortOrder` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseResourceSubmission` (
    `id` VARCHAR(191) NOT NULL,
    `resourceId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `reviewerId` VARCHAR(191) NULL,
    `body` LONGTEXT NULL,
    `linkUrl` VARCHAR(191) NULL,
    `storageKey` VARCHAR(191) NULL,
    `attachmentLabel` VARCHAR(191) NULL,
    `mimeType` VARCHAR(191) NULL,
    `sizeInBytes` INTEGER NULL,
    `status` ENUM('SUBMITTED', 'REVIEWED', 'CHANGES_REQUESTED') NOT NULL DEFAULT 'SUBMITTED',
    `score` DOUBLE NULL,
    `feedback` LONGTEXT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CourseResourceSubmission_resourceId_status_submittedAt_idx`(`resourceId` ASC, `status` ASC, `submittedAt` ASC),
    UNIQUE INDEX `CourseResourceSubmission_resourceId_studentId_key`(`resourceId` ASC, `studentId` ASC),
    INDEX `CourseResourceSubmission_reviewerId_reviewedAt_idx`(`reviewerId` ASC, `reviewedAt` ASC),
    INDEX `CourseResourceSubmission_studentId_submittedAt_idx`(`studentId` ASC, `submittedAt` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseTeacherAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CourseTeacherAssignment_courseId_userId_key`(`courseId` ASC, `userId` ASC),
    INDEX `CourseTeacherAssignment_userId_idx`(`userId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ForumAttachment` (
    `id` VARCHAR(191) NOT NULL,
    `threadId` VARCHAR(191) NULL,
    `postId` VARCHAR(191) NULL,
    `kind` ENUM('FILE', 'IMAGE', 'LINK', 'VIDEO') NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NULL,
    `sizeInBytes` INTEGER NULL,
    `storageKey` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ForumAttachment_postId_idx`(`postId` ASC),
    INDEX `ForumAttachment_threadId_idx`(`threadId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ForumAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `courseSlug` VARCHAR(191) NOT NULL,
    `forumSpaceId` VARCHAR(191) NULL,
    `threadId` VARCHAR(191) NULL,
    `postId` VARCHAR(191) NULL,
    `actorId` VARCHAR(191) NOT NULL,
    `actorRole` ENUM('STUDENT', 'TEACHER', 'ADMIN') NOT NULL,
    `action` ENUM('THREAD_CREATED', 'THREAD_UPDATED', 'THREAD_PINNED', 'THREAD_UNPINNED', 'THREAD_CLOSED', 'THREAD_REOPENED', 'THREAD_DELETED', 'THREAD_RESTORED', 'POST_CREATED', 'POST_UPDATED', 'POST_DELETED', 'POST_RESTORED', 'POST_MARKED_RESOLVED', 'POST_UNMARKED_RESOLVED', 'REPORT_CREATED', 'REPORT_REVIEWED', 'REPORT_DISMISSED', 'SPACE_ARCHIVED', 'SPACE_RESTORED', 'SPACE_DELETED') NOT NULL,
    `metadataJson` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ForumAuditLog_courseSlug_createdAt_idx`(`courseSlug` ASC, `createdAt` ASC),
    INDEX `ForumAuditLog_forumSpaceId_createdAt_idx`(`forumSpaceId` ASC, `createdAt` ASC),
    INDEX `ForumAuditLog_threadId_createdAt_idx`(`threadId` ASC, `createdAt` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ForumCategory` (
    `id` VARCHAR(191) NOT NULL,
    `courseSlug` VARCHAR(191) NOT NULL,
    `forumSpaceId` VARCHAR(191) NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ForumCategory_courseSlug_slug_idx`(`courseSlug` ASC, `slug` ASC),
    INDEX `ForumCategory_courseSlug_sortOrder_idx`(`courseSlug` ASC, `sortOrder` ASC),
    UNIQUE INDEX `ForumCategory_forumSpaceId_slug_key`(`forumSpaceId` ASC, `slug` ASC),
    INDEX `ForumCategory_forumSpaceId_sortOrder_idx`(`forumSpaceId` ASC, `sortOrder` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ForumNotification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `courseSlug` VARCHAR(191) NOT NULL,
    `type` ENUM('THREAD_REPLY', 'MENTION', 'TEACHER_ANNOUNCEMENT', 'THREAD_REPORTED', 'MODERATION_ACTION') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` LONGTEXT NOT NULL,
    `linkPath` VARCHAR(191) NOT NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ForumNotification_userId_readAt_createdAt_idx`(`userId` ASC, `readAt` ASC, `createdAt` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ForumPost` (
    `id` VARCHAR(191) NOT NULL,
    `threadId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `authorRole` ENUM('STUDENT', 'TEACHER', 'ADMIN') NOT NULL,
    `body` LONGTEXT NOT NULL,
    `editedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ForumPost_authorId_fkey`(`authorId` ASC),
    INDEX `ForumPost_threadId_createdAt_idx`(`threadId` ASC, `createdAt` ASC),
    INDEX `ForumPost_threadId_deletedAt_idx`(`threadId` ASC, `deletedAt` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ForumReport` (
    `id` VARCHAR(191) NOT NULL,
    `threadId` VARCHAR(191) NULL,
    `postId` VARCHAR(191) NULL,
    `reportedById` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `notes` LONGTEXT NULL,
    `status` ENUM('OPEN', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN') NOT NULL DEFAULT 'OPEN',
    `resolvedAt` DATETIME(3) NULL,
    `resolvedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ForumReport_postId_idx`(`postId` ASC),
    INDEX `ForumReport_status_createdAt_idx`(`status` ASC, `createdAt` ASC),
    INDEX `ForumReport_threadId_idx`(`threadId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ForumSpace` (
    `id` VARCHAR(191) NOT NULL,
    `courseSlug` VARCHAR(191) NOT NULL,
    `editionLabel` VARCHAR(191) NOT NULL,
    `editionNumber` INTEGER NOT NULL,
    `status` ENUM('ACTIVE', 'ARCHIVED', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `archivedAt` DATETIME(3) NULL,
    `archivedById` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ForumSpace_courseSlug_editionNumber_key`(`courseSlug` ASC, `editionNumber` ASC),
    INDEX `ForumSpace_courseSlug_status_idx`(`courseSlug` ASC, `status` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ForumThread` (
    `id` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `authorRole` ENUM('STUDENT', 'TEACHER', 'ADMIN') NOT NULL,
    `type` ENUM('DISCUSSION', 'ANNOUNCEMENT') NOT NULL DEFAULT 'DISCUSSION',
    `title` VARCHAR(191) NOT NULL,
    `body` LONGTEXT NOT NULL,
    `isPinned` BOOLEAN NOT NULL DEFAULT false,
    `isClosed` BOOLEAN NOT NULL DEFAULT false,
    `isResolved` BOOLEAN NOT NULL DEFAULT false,
    `resolvedPostId` VARCHAR(191) NULL,
    `isReadOnly` BOOLEAN NOT NULL DEFAULT false,
    `scheduledFor` DATETIME(3) NULL,
    `publishedAt` DATETIME(3) NULL,
    `editedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedById` VARCHAR(191) NULL,
    `lastActivityAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ForumThread_authorId_fkey`(`authorId` ASC),
    INDEX `ForumThread_categoryId_isPinned_lastActivityAt_idx`(`categoryId` ASC, `isPinned` ASC, `lastActivityAt` ASC),
    INDEX `ForumThread_categoryId_type_deletedAt_idx`(`categoryId` ASC, `type` ASC, `deletedAt` ASC),
    INDEX `ForumThread_resolvedPostId_fkey`(`resolvedPostId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationPreference` (
    `userId` VARCHAR(191) NOT NULL,
    `emailEnabled` BOOLEAN NOT NULL DEFAULT true,
    `webEnabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`userId` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Promotion` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NULL,
    `discountType` ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL,
    `amountInCents` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `validFrom` DATETIME(3) NULL,
    `validUntil` DATETIME(3) NULL,
    `usageLimit` INTEGER NULL,
    `scope` ENUM('GLOBAL', 'COURSE') NOT NULL DEFAULT 'GLOBAL',
    `courseId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Promotion_code_key`(`code` ASC),
    INDEX `Promotion_courseId_isActive_idx`(`courseId` ASC, `isActive` ASC),
    INDEX `Promotion_createdById_fkey`(`createdById` ASC),
    INDEX `Promotion_isActive_code_idx`(`isActive` ASC, `code` ASC),
    INDEX `Promotion_updatedById_fkey`(`updatedById` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PromotionRedemption` (
    `id` VARCHAR(191) NOT NULL,
    `promotionId` VARCHAR(191) NOT NULL,
    `purchaseId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `discountInCents` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PromotionRedemption_courseId_fkey`(`courseId` ASC),
    INDEX `PromotionRedemption_promotionId_createdAt_idx`(`promotionId` ASC, `createdAt` ASC),
    UNIQUE INDEX `PromotionRedemption_purchaseId_key`(`purchaseId` ASC),
    INDEX `PromotionRedemption_userId_createdAt_idx`(`userId` ASC, `createdAt` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Purchase` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `courseEditionId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `subtotalInCents` INTEGER NOT NULL,
    `discountInCents` INTEGER NOT NULL DEFAULT 0,
    `taxInCents` INTEGER NOT NULL DEFAULT 0,
    `totalInCents` INTEGER NOT NULL,
    `promotionId` VARCHAR(191) NULL,
    `promotionCode` VARCHAR(191) NULL,
    `stripeCheckoutSessionId` VARCHAR(191) NULL,
    `stripePaymentIntentId` VARCHAR(191) NULL,
    `courseSlugSnapshot` VARCHAR(191) NOT NULL,
    `courseTitleSnapshot` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Purchase_courseEditionId_status_idx`(`courseEditionId` ASC, `status` ASC),
    INDEX `Purchase_courseId_fkey`(`courseId` ASC),
    INDEX `Purchase_promotionId_fkey`(`promotionId` ASC),
    UNIQUE INDEX `Purchase_stripeCheckoutSessionId_key`(`stripeCheckoutSessionId` ASC),
    UNIQUE INDEX `Purchase_stripePaymentIntentId_key`(`stripePaymentIntentId` ASC),
    INDEX `Purchase_userId_courseId_status_idx`(`userId` ASC, `courseId` ASC, `status` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StoredAsset` (
    `storageKey` VARCHAR(191) NOT NULL,
    `content` LONGBLOB NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`storageKey` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `globalRole` ENUM('STUDENT', 'TEACHER', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `deactivatedAt` DATETIME(3) NULL,
    `deactivatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `User_deactivatedById_fkey`(`deactivatedById` ASC),
    UNIQUE INDEX `User_email_key`(`email` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserNotification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `category` ENUM('PURCHASE', 'COURSE', 'FORUM', 'SYSTEM') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` LONGTEXT NOT NULL,
    `linkPath` VARCHAR(191) NOT NULL,
    `metadataJson` LONGTEXT NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserNotification_userId_readAt_createdAt_idx`(`userId` ASC, `readAt` ASC, `createdAt` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_clonedFromId_fkey` FOREIGN KEY (`clonedFromId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseEdition` ADD CONSTRAINT `CourseEdition_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseEditionTeacherAssignment` ADD CONSTRAINT `CourseEditionTeacherAssignment_courseEditionId_fkey` FOREIGN KEY (`courseEditionId`) REFERENCES `CourseEdition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseEditionTeacherAssignment` ADD CONSTRAINT `CourseEditionTeacherAssignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseEnrollment` ADD CONSTRAINT `CourseEnrollment_courseEditionId_fkey` FOREIGN KEY (`courseEditionId`) REFERENCES `CourseEdition`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseEnrollment` ADD CONSTRAINT `CourseEnrollment_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseEnrollment` ADD CONSTRAINT `CourseEnrollment_purchaseId_fkey` FOREIGN KEY (`purchaseId`) REFERENCES `Purchase`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseEnrollment` ADD CONSTRAINT `CourseEnrollment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseMembership` ADD CONSTRAINT `CourseMembership_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseModule` ADD CONSTRAINT `CourseModule_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseModuleProgress` ADD CONSTRAINT `CourseModuleProgress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseResource` ADD CONSTRAINT `CourseResource_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseResource` ADD CONSTRAINT `CourseResource_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseResource` ADD CONSTRAINT `CourseResource_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `CourseModule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseResourceSubmission` ADD CONSTRAINT `CourseResourceSubmission_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `CourseResource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseResourceSubmission` ADD CONSTRAINT `CourseResourceSubmission_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseResourceSubmission` ADD CONSTRAINT `CourseResourceSubmission_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseTeacherAssignment` ADD CONSTRAINT `CourseTeacherAssignment_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseTeacherAssignment` ADD CONSTRAINT `CourseTeacherAssignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumAttachment` ADD CONSTRAINT `ForumAttachment_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `ForumPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumAttachment` ADD CONSTRAINT `ForumAttachment_threadId_fkey` FOREIGN KEY (`threadId`) REFERENCES `ForumThread`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumCategory` ADD CONSTRAINT `ForumCategory_forumSpaceId_fkey` FOREIGN KEY (`forumSpaceId`) REFERENCES `ForumSpace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumNotification` ADD CONSTRAINT `ForumNotification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumPost` ADD CONSTRAINT `ForumPost_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumPost` ADD CONSTRAINT `ForumPost_threadId_fkey` FOREIGN KEY (`threadId`) REFERENCES `ForumThread`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumReport` ADD CONSTRAINT `ForumReport_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `ForumPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumReport` ADD CONSTRAINT `ForumReport_threadId_fkey` FOREIGN KEY (`threadId`) REFERENCES `ForumThread`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumThread` ADD CONSTRAINT `ForumThread_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumThread` ADD CONSTRAINT `ForumThread_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `ForumCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumThread` ADD CONSTRAINT `ForumThread_resolvedPostId_fkey` FOREIGN KEY (`resolvedPostId`) REFERENCES `ForumPost`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationPreference` ADD CONSTRAINT `NotificationPreference_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Promotion` ADD CONSTRAINT `Promotion_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Promotion` ADD CONSTRAINT `Promotion_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Promotion` ADD CONSTRAINT `Promotion_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PromotionRedemption` ADD CONSTRAINT `PromotionRedemption_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PromotionRedemption` ADD CONSTRAINT `PromotionRedemption_promotionId_fkey` FOREIGN KEY (`promotionId`) REFERENCES `Promotion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PromotionRedemption` ADD CONSTRAINT `PromotionRedemption_purchaseId_fkey` FOREIGN KEY (`purchaseId`) REFERENCES `Purchase`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PromotionRedemption` ADD CONSTRAINT `PromotionRedemption_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Purchase` ADD CONSTRAINT `Purchase_courseEditionId_fkey` FOREIGN KEY (`courseEditionId`) REFERENCES `CourseEdition`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Purchase` ADD CONSTRAINT `Purchase_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Purchase` ADD CONSTRAINT `Purchase_promotionId_fkey` FOREIGN KEY (`promotionId`) REFERENCES `Promotion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Purchase` ADD CONSTRAINT `Purchase_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_deactivatedById_fkey` FOREIGN KEY (`deactivatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserNotification` ADD CONSTRAINT `UserNotification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

