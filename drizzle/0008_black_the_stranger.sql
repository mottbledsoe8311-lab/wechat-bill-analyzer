CREATE TABLE `visitorStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitorId` varchar(64) NOT NULL,
	`date` varchar(10) NOT NULL,
	`visitCount` int NOT NULL DEFAULT 1,
	`uploadCount` int NOT NULL DEFAULT 0,
	`lastVisitAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `visitorStats_id` PRIMARY KEY(`id`),
	CONSTRAINT `visitorStats_visitorId_unique` UNIQUE(`visitorId`)
);
--> statement-breakpoint
CREATE INDEX `dateVisitorIdx` ON `visitorStats` (`date`,`visitorId`);