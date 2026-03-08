// CoinMarketCap API types
export interface CMCApiResponse {
	status: {
		timestamp: string;
		error_code: number;
		error_message: string | null;
		elapsed: number;
		credit_count: number;
		notice: string | null;
	};
	data: CryptoCoin[];
}

export interface CryptoCoin {
	id: number;
	name: string;
	symbol: string;
	slug: string;
	cmc_rank: number;
	date_added: string;
	circulating_supply: number | null;
	max_supply: number | null;
	quote: {
		USD: {
			price: number;
			volume_24h: number;
			volume_change_24h: number;
			percent_change_1h: number;
			percent_change_24h: number;
			percent_change_7d: number;
			percent_change_30d: number;
			percent_change_60d: number;
			percent_change_90d: number;
			market_cap: number;
			last_updated: string;
		};
	};
}
