// errors schema for exercise outcomes
import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const errors = sqliteTable('errors', {
    id: integer('id').primaryKey(),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// For select queries
export type Result = typeof errors.$inferSelect;

// For insert queries
export type InsertResult = typeof errors.$inferInsert;
