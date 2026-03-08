<script lang="ts">
	import './layout.css';
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import Navbar from '$lib/components/navbar.svelte';
	import '@fontsource/geist-mono';

	let { children } = $props();
</script>

<ModeWatcher />
<div class="shell">
	<div class="frame">
		<Navbar />
		<main class="flex-grow">
			{@render children()}
		</main>
	</div>
</div>
