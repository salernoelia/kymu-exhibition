ALTER TABLE `users` RENAME COLUMN "last_name" TO "completed_exercise_id";--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `first_name`;