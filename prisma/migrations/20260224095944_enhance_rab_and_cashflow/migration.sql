-- AlterTable
ALTER TABLE `Cashflow` ADD COLUMN `budget` DECIMAL(15, 2) NULL,
    ADD COLUMN `quantity` DECIMAL(10, 2) NULL,
    ADD COLUMN `unit` VARCHAR(191) NULL,
    ADD COLUMN `unitPrice` DECIMAL(15, 2) NULL;

-- AlterTable
ALTER TABLE `RAB` ADD COLUMN `realUnitPrice` DECIMAL(15, 2) NULL,
    ADD COLUMN `unitPrice` DECIMAL(15, 2) NULL;
