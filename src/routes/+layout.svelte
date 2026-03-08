<script lang="ts">
	import './layout.css';
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import Navbar from '$lib/components/navbar.svelte';
	import '@fontsource/geist-mono';
	let { children } = $props();
</script>

<ModeWatcher />
<div class="bg-background relative flex min-h-screen w-full justify-center">
	<div
		class="border-border flex min-h-screen w-full max-w-[1600px] flex-col border-x bg-transparent"
	>
		<Navbar />
		<main class="flex-grow">
			{@render children()}
		</main>
	</div>
</div>
