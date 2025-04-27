CREATE TABLE `results` (
	`id` integer PRIMARY KEY NOT NULL,
	`exercise_id` text NOT NULL,
	`achieved_repetitions` integer,
	`achieved_seconds` integer,
	`achieved_angle` real NOT NULL,
	`pain_angles_deg` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
