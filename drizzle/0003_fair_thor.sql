CREATE TABLE `riskAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountName` varchar(255) NOT NULL,
	`riskLevel` enum('high','medium','low') NOT NULL DEFAULT 'high',
	`regularity` int NOT NULL DEFAULT 100,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `riskAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `riskAccounts_accountName_unique` UNIQUE(`accountName`)
);
