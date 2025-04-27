//server/api/results.post.ts
import { results, type InsertResult } from '../../db/results';
import { db } from '../sqlite-service';

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);

        // Handle pain angles array - stringify it if it exists
        const newResult: InsertResult = {
            ...body,
            painAnglesDeg: body.painAnglesDeg ? JSON.stringify(body.painAnglesDeg) : null,
        };

        const result = await db.insert(results).values(newResult).execute();
        return {
            newResult: {
                ...newResult,
                painAnglesDeg: body.painAnglesDeg, // Return the original array in response
            },
            result: result,
        };
    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message,
        });
    }
});
