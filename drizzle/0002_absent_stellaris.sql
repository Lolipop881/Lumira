ALTER TABLE `records` ADD `collected_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `records` ADD `sample_type` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `records` ADD `plating_method` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `records` ADD `incubation_hours` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `records` ADD `custom_field` text DEFAULT '' NOT NULL;