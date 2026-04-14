CREATE TABLE `footprintKeywords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`keyword` varchar(100) NOT NULL,
	`category` enum('parking','property','canteen','exclude') NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `footprintKeywords_id` PRIMARY KEY(`id`),
	CONSTRAINT `footprintKeywords_keyword_unique` UNIQUE(`keyword`)
);
--> statement-breakpoint
CREATE TABLE `repaymentKeywords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`keyword` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `repaymentKeywords_id` PRIMARY KEY(`id`),
	CONSTRAINT `repaymentKeywords_keyword_unique` UNIQUE(`keyword`)
);
