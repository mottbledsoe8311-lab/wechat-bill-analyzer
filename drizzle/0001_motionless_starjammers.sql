CREATE TABLE `reports` (
	`id` varchar(32) NOT NULL,
	`userId` int NOT NULL,
	`title` text NOT NULL,
	`data` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
