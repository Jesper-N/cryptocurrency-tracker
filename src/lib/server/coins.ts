import { error } from '@sveltejs/kit';
import { and, asc, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { coins, priceHistory } from '$lib/server/db/schema';

export const size = 30;
export const days = 30;
const span = 60;

type Tick = {
	coinId: string;
	price: string;
	timestamp: Date;
};

function fail(code: number, msg: string): never {
	throw error(code, msg);
}

export async function listCoins() {
	const root = db();
	const rows = await root.select().from(coins).orderBy(desc(coins.marketCap)).limit(size);

	if (!rows.length) {
		fail(503, 'Cryptocurrency data is unavailable');
	}

	const ids = rows.map((row) => row.id);
	const win = sql`partition by ${priceHistory.coinId} order by ${priceHistory.timestamp} desc`;
	const rank = root.$with('rank').as(
		root
			.select({
				coinId: priceHistory.coinId,
				price: priceHistory.price,
				timestamp: priceHistory.timestamp,
				rn: sql<number>`row_number() over (${win})`.as('rn')
			})
			.from(priceHistory)
			.where(inArray(priceHistory.coinId, ids))
	);
	const ticks = await root
		.with(rank)
		.select({
			coinId: rank.coinId,
			price: rank.price,
			timestamp: rank.timestamp
		})
		.from(rank)
		.where(lte(rank.rn, span))
		.orderBy(rank.coinId, asc(rank.timestamp));
	const map = ticks.reduce<Map<string, Tick[]>>((acc, tick) => {
		const list = acc.get(tick.coinId) ?? [];

		list.push(tick);
		acc.set(tick.coinId, list);

		return acc;
	}, new Map());

	return rows.map((row) => ({
		...row,
		history: map.get(row.id) ?? []
	}));
}

export async function getCoin(slug: string) {
	const root = db();
	const rows = await root.select().from(coins).where(eq(coins.slug, slug)).limit(1);

	if (!rows.length) {
		fail(404, `No data found for "${slug}"`);
	}

	const coin = rows[0];

	const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
	const history = await root
		.select({
			price: priceHistory.price,
			timestamp: priceHistory.timestamp
		})
		.from(priceHistory)
		.where(and(eq(priceHistory.coinId, coin.id), gte(priceHistory.timestamp, since)))
		.orderBy(asc(priceHistory.timestamp));

	return { coin, history };
}
