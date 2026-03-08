import { env } from '$env/dynamic/private';

function need(key: 'CMC_API_KEY' | 'DATABASE_URL') {
	const val = env[key];

	if (!val) {
		throw new Error(`${key} is not set`);
	}

	return val;
}

export const privateEnv = {
	get CMC_API_KEY() {
		return need('CMC_API_KEY');
	},
	get DATABASE_URL() {
		return need('DATABASE_URL');
	}
} as const;
