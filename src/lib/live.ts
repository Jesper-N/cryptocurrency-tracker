import { invalidate } from '$app/navigation';

export function live(key: string, span: number) {
	let id: ReturnType<typeof setInterval> | null = null;

	const sync = () => {
		if (document.hidden) {
			if (!id) {
				return;
			}

			clearInterval(id);
			id = null;

			return;
		}

		if (id) {
			return;
		}

		id = setInterval(() => {
			void invalidate(key);
		}, span);
	};

	sync();
	document.addEventListener('visibilitychange', sync);

	return () => {
		document.removeEventListener('visibilitychange', sync);

		if (!id) {
			return;
		}

		clearInterval(id);
	};
}
