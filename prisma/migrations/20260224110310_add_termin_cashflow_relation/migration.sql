/*
  Warnings:

  - A unique constraint covering the columns `[terminId]` on the table `Cashflow` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Cashflow` ADD COLUMN `terminId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Cashflow_terminId_key` ON `Cashflow`(`terminId`);

-- AddForeignKey
ALTER TABLE `Cashflow` ADD CONSTRAINT `Cashflow_terminId_fkey` FOREIGN KEY (`terminId`) REFERENCES `Termin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
