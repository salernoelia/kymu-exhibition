//server/api/results.post.ts
import { results, type InsertResult } from '../../db/results';
import { db } from '../sqlite-service';

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);

        const newResult: InsertResult = {
            ...body,
            painAnglesDeg: body.painAnglesDeg ? JSON.stringify(body.painAnglesDeg) : null,
        };

        const result = await db.insert(results).values(newResult).execute();
        return {
            newResult: {
                ...newResult,
                painAnglesDeg: body.painAnglesDeg, 
            },
            result: result,
        };
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
