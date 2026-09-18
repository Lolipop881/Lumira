CREATE TABLE `measurements` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`data` text NOT NULL,
	`image_key` text,
	`created_at` text NOT NULL
);
