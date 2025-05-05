import { pgTable, serial, text, timestamp, numeric, integer, index } from 'drizzle-orm/pg-core';

// Current data about coins
export const coins = pgTable(
	'coins',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		symbol: text('symbol').notNull(),
		slug: text('slug').notNull(),
		dateAdded: timestamp('date_added').notNull(),
		maxSupply: numeric('max_supply', { precision: 30, scale: 2 }),
		circulatingSupply: numeric('circulating_supply', { precision: 30, scale: 2 }),
		cmcRank: integer('cmc_rank').notNull(),

		// Price data
		currentPrice: numeric('current_price', { precision: 30, scale: 10 }).notNull(),
		volume24h: numeric('volume_24h', { precision: 30, scale: 2 }).notNull(),
		volumeChange24h: numeric('volume_change_24h', { precision: 10, scale: 4 }),
		marketCap: numeric('market_cap', { precision: 30, scale: 2 }).notNull(),

		// Percent changes
		percentChange1h: numeric('percent_change_1h', { precision: 10, scale: 8 }),
		percentChange24h: numeric('percent_change_24h', { precision: 10, scale: 8 }),
		percentChange7d: numeric('percent_change_7d', { precision: 10, scale: 8 }),
		percentChange30d: numeric('percent_change_30d', { precision: 10, scale: 8 }),
		percentChange60d: numeric('percent_change_60d', { precision: 10, scale: 8 }),
		percentChange90d: numeric('percent_change_90d', { precision: 10, scale: 8 }),

		lastUpdated: timestamp('last_updated').notNull().defaultNow()
	},
	(table) => [index('coins_slug_idx').on(table.slug)]
);

// Historical price data about each coin
export const priceHistory = pgTable(
	'price_history',
	{
		id: serial('id').primaryKey(),
		coinId: text('coin_id')
			.notNull()
			.references(() => coins.id),
		price: numeric('price', { precision: 30, scale: 10 }).notNull(),
		timestamp: timestamp('timestamp').notNull().defaultNow()
	},
	(table) => [index('price_history_coin_time_idx').on(table.coinId, table.timestamp)]
);
