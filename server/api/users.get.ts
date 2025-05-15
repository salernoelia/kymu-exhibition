//server/api/users.get.ts
import { users } from '../../db/users';
import { db } from '../sqlite-service';

export default defineEventHandler(async () => {
    try {
        const result = await db.select().from(users).all();
        return { users: result };
    } catch (e: unknown) {
        let message = 'Unknown error';
        if (e instanceof Error) {
            message = e.message;
        }
        throw createError({
            statusCode: 400,
            statusMessage: message,
        });
    }
});
