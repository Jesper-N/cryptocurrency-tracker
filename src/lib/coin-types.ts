export interface PriceHistoryPoint {
	price: string;
	timestamp: Date | string;
}

export interface CoinRecord {
	id: string;
	name: string;
	symbol: string;
	slug: string;
	dateAdded: Date | string;
	maxSupply: string | null;
	circulatingSupply: string | null;
	cmcRank: number;
	currentPrice: string;
	volume24h: string;
	volumeChange24h: string | null;
	marketCap: string;
	percentChange1h: string | null;
	percentChange24h: string | null;
	percentChange7d: string | null;
	percentChange30d: string | null;
	percentChange60d: string | null;
	percentChange90d: string | null;
	lastUpdated: Date | string;
}

export interface CoinWithHistory extends CoinRecord {
	history: PriceHistoryPoint[];
}

export interface CoinsResponse {
	coins: CoinWithHistory[];
}

export interface CoinDetailResponse {
	coin: CoinRecord;
	history: PriceHistoryPoint[];
}
