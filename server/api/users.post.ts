//server/api/users.post.ts
import { users, type InsertUser } from '../../db/users';
import { db } from '../sqlite-service';

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);
        const newUser: InsertUser = {
            ...body,
        };
        const result = db.insert(users).values(newUser).execute();
        return { newUser: newUser, result: result };
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
