import type { PageServerLoad } from './$types';
import { error as svelteKitError } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ fetch, params }) => {
	const slug = params.slug;

	try {
		// Fetch data from the coin api endpoint
		const response = await fetch(`/api/currencies/${slug}`);

		if (!response.ok) {
			// Forward the error status and message from the api endpoint
			const errorData = await response.json().catch(() => ({ message: 'Failed to load data' }));
			throw svelteKitError(
				response.status,
				errorData?.message || `API returned ${response.status}`
			);
		}

		const data = await response.json();

		return {
			coin: data.coin,
			history: data.history
		};
	} catch (err: any) {
		// Catch specific sveltekit errors or handle general errors
		if (err instanceof Error && 'status' in err && typeof err.status === 'number') {
			throw err;
		}
		console.error(`Error loading page data for slug ${slug}:`, err);
		throw svelteKitError(500, `${err.body.message}`);
	}
};
