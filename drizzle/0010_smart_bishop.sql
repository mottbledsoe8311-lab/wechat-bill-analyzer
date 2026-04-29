ALTER TABLE `visitorStats` DROP INDEX `visitorStats_visitorId_unique`;--> statement-breakpoint
ALTER TABLE `visitorStats` ADD CONSTRAINT `visitorDateUnique` UNIQUE(`visitorId`,`date`);