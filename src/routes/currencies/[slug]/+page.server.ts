import { getCoin } from '$lib/server/coins';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ depends, params }) => {
	depends(`data:coin:${params.slug}`);

	return getCoin(params.slug);
};
