import { json, error as svelteKitError } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getCoin } from '$lib/server/coins';

export const GET: RequestHandler = async ({ params }) => {
	if (!params.slug) {
		throw svelteKitError(400, 'Coin slug is required');
	}

	return json(await getCoin(params.slug));
};
