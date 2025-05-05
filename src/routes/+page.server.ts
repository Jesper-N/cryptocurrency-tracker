import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const response = await fetch('/api/currencies');

		if (!response.ok) {
			throw new Error(`API returned ${response.status}`);
		}

		const data = await response.json();

		return {
			coins: data.coins
		};
	} catch (error) {
		console.error('Error loading cryptocurrency data:', error);
		return {
			coins: [],
			error: 'Failed to load cryptocurrency data'
		};
	}
};
