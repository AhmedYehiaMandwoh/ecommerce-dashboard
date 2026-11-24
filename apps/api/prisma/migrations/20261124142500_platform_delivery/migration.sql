CREATE TABLE `DeliveryArea` (
 `id` VARCHAR(191) NOT NULL,
 `city` VARCHAR(191) NOT NULL,
 `area` VARCHAR(191) NOT NULL,
 `fee` INTEGER NOT NULL,
 `active` BOOLEAN NOT NULL DEFAULT true,
 `updatedAt` DATETIME(3) NOT NULL,
 UNIQUE INDEX `DeliveryArea_city_area_key`(`city`,`area`),
 PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
