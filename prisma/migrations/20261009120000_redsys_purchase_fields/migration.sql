-- AlterTable
ALTER TABLE `Purchase` ADD COLUMN `redsysOrder` VARCHAR(12) NULL,
    ADD COLUMN `redsysAuthorisationCode` VARCHAR(16) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Purchase_redsysOrder_key` ON `Purchase`(`redsysOrder`);
