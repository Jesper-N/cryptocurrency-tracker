import type { CoinDetailResponse } from '../../../lib/coin-types.js';
import type { PageServerLoad } from './$types';
import { error as svelteKitError } from '@sveltejs/kit';

type ErrorWithStatus = Error & {
	status: number;
};

function isErrorWithStatus(value: unknown): value is ErrorWithStatus {
	return value instanceof Error && 'status' in value && typeof value.status === 'number';
}

export const load: PageServerLoad = async ({ fetch, params }) => {
	const slug = params.slug;

	try {
		const response = await fetch(`/api/currencies/${slug}`);

		if (!response.ok) {
			const errorData = (await response
				.json()
				.catch(() => ({ message: 'Failed to load data' }))) as Partial<CoinDetailResponse>;
			throw svelteKitError(
				response.status,
				errorData.message ?? `API returned ${String(response.status)}`
			);
		}

		const data = (await response.json()) as CoinDetailResponse;

		return {
			coin: data.coin,
			history: data.history
		};
	} catch (error: unknown) {
		if (isErrorWithStatus(error)) {
			throw error;
		}

		console.error(`Error loading page data for slug ${slug}:`, error);
		throw svelteKitError(500, 'Failed to load coin data');
	}
};
