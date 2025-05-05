import type { RequestEvent } from '@sveltejs/kit';

export type RequestHandler = {
	GET?: (event: RequestEvent) => Promise<Response> | Response;
	POST?: (event: RequestEvent) => Promise<Response> | Response;
	PUT?: (event: RequestEvent) => Promise<Response> | Response;
	DELETE?: (event: RequestEvent) => Promise<Response> | Response;
	PATCH?: (event: RequestEvent) => Promise<Response> | Response;
};

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

export interface PriceHistoryPoint {
	price: string;
	timestamp: string;
}
