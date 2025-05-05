import { json, error as svelteKitError } from '@sveltejs/kit';
import type { RequestHandler } from '$lib/types';
import { db } from '$lib/server/db';
import { coins, priceHistory } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';

export const GET: RequestHandler['GET'] = async ({ params }) => {
	const slug = params.slug;

	if (!slug) {
		throw svelteKitError(400, 'Coin name parameter is required');
	}

	try {
		// Fetch the coin details by slug
		const coinResult = await db.select().from(coins).where(eq(coins.slug, slug)).limit(1);

		if (coinResult.length === 0) {
			throw svelteKitError(404, `No data found for "${slug}"`);
		}

		const coin = coinResult[0];

		// Fetch the complete price history for this coin
		const history = await db
			.select({
				price: priceHistory.price,
				timestamp: priceHistory.timestamp
			})
			.from(priceHistory)
			.where(eq(priceHistory.coinId, coin.id))
			.orderBy(asc(priceHistory.timestamp));
		return json({
			coin: coin,
			history: history
		});
	} catch (err: unknown) {
		// Catch specific SvelteKit errors or handle general errors
		if (err instanceof Error && 'status' in err && typeof err.status === 'number') {
			throw err;
		}
		console.error(`Error fetching coin data for ${slug}:`, err);
		throw svelteKitError(500, `Failed to fetch coin data for ${slug}`);
	}
};
