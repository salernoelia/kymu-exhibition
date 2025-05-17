//server/api/results.get.ts
import { results } from '../../db/results';
import { db } from '../sqlite-service';

export default defineEventHandler(async () => {
    try {
        const result = await db.select().from(results).all();

        const formattedResults = result.map((item) => ({
            ...item,
            painAnglesDeg: item.painAnglesDeg ? JSON.parse(item.painAnglesDeg) : [],
        }));

        return { results: formattedResults };
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
