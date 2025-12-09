import ky from 'ky';
import { db } from '$lib/server/db';
import { coins, priceHistory } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import type { CMCApiResponse } from '$lib/types';

const CMC_API_KEY = env.CMC_API_KEY || '';
const API_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest';
const FETCH_INTERVAL = 70000;
const COIN_LIMIT = 30;

// Fetch cryptocurrency data from CoinMarketCap API
async function fetchCryptoData(): Promise<CMCApiResponse> {
	try {
		const response = await ky
			.get(API_URL, {
				searchParams: {
					start: '1',
					limit: COIN_LIMIT.toString(),
					convert: 'USD'
				},
				headers: {
					'X-CMC_PRO_API_KEY': CMC_API_KEY,
					Accept: 'application/json'
				},
				timeout: 10000
			})
			.json<CMCApiResponse>();

		return response;
	} catch (error) {
		console.error('Error fetching cryptocurrency data:', error);
		throw error;
	}
}

// Update database with the latest cryptocurrency data
async function updateDatabase(cryptoData: CMCApiResponse): Promise<void> {
	const { data: cryptoCoins } = cryptoData;

	for (const coin of cryptoCoins) {
		const usdData = coin.quote.USD;
		const coinId = coin.id.toString();

		try {
			const existingCoin = await db.select().from(coins).where(eq(coins.id, coinId)).limit(1);
			const coinData = {
				id: coinId,
				name: coin.name,
				symbol: coin.symbol,
				slug: coin.slug,
				dateAdded: new Date(coin.date_added),
				maxSupply: coin.max_supply ? String(coin.max_supply) : null,
				circulatingSupply: coin.circulating_supply ? String(coin.circulating_supply) : null,
				cmcRank: coin.cmc_rank,
				currentPrice: String(usdData.price),
				volume24h: String(usdData.volume_24h),
				volumeChange24h: usdData.volume_change_24h ? String(usdData.volume_change_24h) : null,
				marketCap: String(usdData.market_cap),
				percentChange1h: usdData.percent_change_1h ? String(usdData.percent_change_1h) : null,
				percentChange24h: usdData.percent_change_24h ? String(usdData.percent_change_24h) : null,
				percentChange7d: usdData.percent_change_7d ? String(usdData.percent_change_7d) : null,
				percentChange30d: usdData.percent_change_30d ? String(usdData.percent_change_30d) : null,
				percentChange60d: usdData.percent_change_60d ? String(usdData.percent_change_60d) : null,
				percentChange90d: usdData.percent_change_90d ? String(usdData.percent_change_90d) : null,
				lastUpdated: new Date()
			};

			// Update or insert the coin data
			if (existingCoin.length > 0) {
				await db.update(coins).set(coinData).where(eq(coins.id, coinId));
			} else {
				await db.insert(coins).values(coinData);
			}

			await db.insert(priceHistory).values({
				coinId: coinId,
				price: String(usdData.price),
				timestamp: new Date()
			});
		} catch (error) {
			console.error(`Error processing coin ${coin.name}:`, error);
		}
	}

	console.log(`Updated ${cryptoCoins.length} cryptocurrencies at ${new Date().toISOString()}`);
}

// Run a single update cycle
async function runUpdateCycle(): Promise<void> {
	try {
		const data = await fetchCryptoData();
		await updateDatabase(data);
	} catch (error) {
		console.error('Update cycle failed:', error);
	}
}

// Initialize the polling service
export function initCMCPollingService(): { stop: () => void } {
	console.log('Starting CMC polling service...');
	runUpdateCycle();

	// Set up interval for subsequent updates
	const intervalId = setInterval(runUpdateCycle, FETCH_INTERVAL);

	return {
		stop: () => {
			clearInterval(intervalId);
			console.log('CMC polling service stopped');
		}
	};
}
