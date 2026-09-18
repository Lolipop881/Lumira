CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sample_id` text NOT NULL,
	`medium` text NOT NULL,
	`location` text NOT NULL,
	`temperature` text NOT NULL,
	`notes` text NOT NULL,
	`dilution` integer NOT NULL,
	`volume` real NOT NULL,
	`count` integer NOT NULL,
	`cfu` real NOT NULL,
	`points` text NOT NULL,
	`image_key` text NOT NULL,
	`created_at` text NOT NULL
);
