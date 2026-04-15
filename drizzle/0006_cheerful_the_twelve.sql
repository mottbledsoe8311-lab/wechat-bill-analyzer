CREATE TABLE `dailyStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`uploadCount` int NOT NULL DEFAULT 0,
	`shareCount` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dailyStats_id` PRIMARY KEY(`id`),
	CONSTRAINT `dailyStats_date_unique` UNIQUE(`date`)
);
