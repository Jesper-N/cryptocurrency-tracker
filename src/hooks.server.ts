import { initCMCPollingService } from '$lib/server/cmc-poller';
import type { Handle } from '@sveltejs/kit';

let svc: { stop: () => void } | null = null;

export const handle: Handle = async ({ event, resolve }) => {
	svc ??= initCMCPollingService();

	return resolve(event, {
		preload: ({ type }) => type === 'font' || type === 'css' || type === 'js'
	});
};
