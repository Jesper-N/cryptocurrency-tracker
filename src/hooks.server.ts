import { initCMCPollingService } from '$lib/server/cmc-poller';
import type { Handle } from '@sveltejs/kit';

// Start the polling service when the server starts
let cmcPollingService: { stop: () => void } | null = null;

export const handle: Handle = async ({ event, resolve }) => {
	// Initialize the polling service if it's not already running
	if (!cmcPollingService) {
		cmcPollingService = initCMCPollingService();
	}

	return await resolve(event);
};
