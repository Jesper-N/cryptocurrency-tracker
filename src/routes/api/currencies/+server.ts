import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { coins, priceHistory } from '$lib/server/db/schema';
import { desc, asc, inArray, sql, lte } from 'drizzle-orm';

type HistoryEntry = { price: string; timestamp: Date };

export const GET: RequestHandler = async () => {
	try {
		// Fetch top 30 coins by market cap
		const topCoinsData = await db.select().from(coins).orderBy(desc(coins.marketCap)).limit(30);

		// Extract just the IDs for the history query filter
		const topCoinIds = topCoinsData.map((coin) => coin.id);

		// If no coins found, return early
		if (topCoinIds.length === 0) {
			return json({ coins: [] });
		}

		// Fetch recent history for all top 30 coins in one query
		// Define CTE to rank history entries
		const priceHistoryWindow = sql`partition by ${priceHistory.coinId} order by ${priceHistory.timestamp} desc`;
		const rankedHistoryCTE = db.$with('ranked_history').as(
			db
				.select({
					coinId: priceHistory.coinId,
					price: priceHistory.price,
					timestamp: priceHistory.timestamp,
					rn: sql<number>`row_number() over (${priceHistoryWindow})`.as('rn')
				})
				.from(priceHistory)
				.where(inArray(priceHistory.coinId, topCoinIds))
		);

		// Select from the CTE, filtering for the top 60 ranks per coin
		const recentHistoryForAllCoins = await db
			.with(rankedHistoryCTE)
			.select({
				// Select necessary fields including coinId for mapping
				coinId: rankedHistoryCTE.coinId,
				price: rankedHistoryCTE.price,
				timestamp: rankedHistoryCTE.timestamp
			})
			.from(rankedHistoryCTE)
			.where(lte(rankedHistoryCTE.rn, 60))
			.orderBy(
				// Order results primarily by coinId, then by timestamp ascending
				rankedHistoryCTE.coinId,
				asc(rankedHistoryCTE.timestamp)
			);

		// Group history by coin ID
		const historyMap = new Map<string, HistoryEntry[]>();
		for (const historyEntry of recentHistoryForAllCoins) {
			if (!historyMap.has(historyEntry.coinId)) {
				historyMap.set(historyEntry.coinId, []);
			}
			// Push the entry
			historyMap.get(historyEntry.coinId)?.push({
				price: historyEntry.price,
				timestamp: historyEntry.timestamp
			});
		}

		// Combine Coin Data with grouped history
		const coinsWithHistory = topCoinsData.map((coin) => ({
			...coin,
			// Get the history for this coin from the map, or an empty array if none found
			history: historyMap.get(coin.id) || []
		}));

		return json({
			coins: coinsWithHistory
		});
	} catch (error) {
		console.error('Error fetching coins with history:', error);
		return json({ error: 'Failed to fetch coins data with history' }, { status: 500 });
	}
};
