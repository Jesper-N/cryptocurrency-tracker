<script lang="ts">
	import './layout.css';
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import Navbar from '$lib/components/navbar.svelte';
	import '@fontsource-variable/montserrat';
	let { children } = $props();
</script>

<ModeWatcher />
<div class="bg-background relative flex min-h-screen w-screen flex-col overflow-hidden">
	<Navbar />
	{@render children()}
</div>
