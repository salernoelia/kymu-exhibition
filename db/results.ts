// Results schema for exercise outcomes
import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const results = sqliteTable('results', {
    id: integer('id').primaryKey(),
    exerciseId: text('exercise_id').notNull(),
    achievedRepetitions: integer('achieved_repetitions'),
    achievedSeconds: integer('achieved_seconds'),
    achievedAngle: real('achieved_angle').notNull(),
    painAnglesDeg: text('pain_angles_deg'), // Stored as JSON string
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// For select queries
export type Result = typeof results.$inferSelect;

// For insert queries
export type InsertResult = typeof results.$inferInsert;
