// drizzle.config.ts

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: ['./db/users.ts', './db/results.ts'],
    out: './drizzle',
    dialect: 'sqlite',
    dbCredentials: {
        url: 'drizzle.db',
    },
});
