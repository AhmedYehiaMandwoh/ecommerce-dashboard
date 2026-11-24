CREATE TABLE ProductProposal (
  productId VARCHAR(191) NOT NULL,
  ownerId VARCHAR(191) NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER NOT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX ProductProposal_ownerId_idx(ownerId),
  PRIMARY KEY (productId)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
