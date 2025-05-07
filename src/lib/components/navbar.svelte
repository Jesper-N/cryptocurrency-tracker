<script lang="ts">
	import { Sun, Moon, Search } from '@lucide/svelte';
	import { resetMode, setMode } from 'mode-watcher';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	// Logo constants
	const LOGO_CONFIG = {
		color: 'currentColor',
		size: 26,
		strokeWidth: 2,
		animationDuration: 700,
		debounceDelay: 100
	} as const;

	let shouldAnimate = $state(false);
	let animationTimer: ReturnType<typeof setTimeout>;
	let debounceTimer: ReturnType<typeof setTimeout>;

	// Animation function with debounce
	function animateLogo() {
		// Clear any existing animation timer
		clearTimeout(animationTimer);
		clearTimeout(debounceTimer);

		// Debounce the animation start
		debounceTimer = setTimeout(() => {
			shouldAnimate = true;
			animationTimer = setTimeout(() => {
				shouldAnimate = false;
			}, LOGO_CONFIG.animationDuration);
		}, LOGO_CONFIG.debounceDelay);
	}

	// Initial animation
	$effect(() => {
		animateLogo();
		return () => {
			clearTimeout(animationTimer);
			clearTimeout(debounceTimer);
		};
	});
</script>

<div class="flex w-full items-center justify-between border-b border-muted py-4">
	<div class="flex items-center px-4">
		<div class="flex items-center pr-8">
			<div
				class="mr-3 cursor-pointer"
				aria-label="chart-line"
				role="img"
				onmouseenter={animateLogo}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width={LOGO_CONFIG.size}
					height={LOGO_CONFIG.size}
					viewBox="0 0 24 24"
					fill="none"
					stroke={LOGO_CONFIG.color}
					stroke-width={LOGO_CONFIG.strokeWidth}
					stroke-linecap="round"
					stroke-linejoin="round"
					class="chart-line-icon transition-transform hover:scale-105"
					class:animate={shouldAnimate}
					aria-hidden="true"
					focusable="false"
				>
					<path d="M3 3v16a2 2 0 0 0 2 2h16" class="frame" />
					<path d="m7 13 3-3 4 4 5-5" class="line" />
				</svg>
			</div>
			<p class="text-xl font-medium">Cryptocurrency Tracker</p>
		</div>

		<nav class="flex gap-x-6">
			<a href="/" class="text-sm font-medium transition-colors hover:text-primary">
				Cryptocurrencies
			</a>
			<a href="/" class="text-sm font-medium transition-colors hover:text-primary"> DexScan </a>
			<a href="/" class="text-sm font-medium transition-colors hover:text-primary"> Exchanges </a>
			<a href="/" class="text-sm font-medium transition-colors hover:text-primary"> Community </a>
			<a href="/" class="text-sm font-medium transition-colors hover:text-primary"> Products </a>
		</nav>
	</div>

	<div class="flex justify-center">
		<div>
			<Button variant="outline" class="justify-betwee w-64 justify-between">
				<div class="flex items-center">
					<Search class="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
					Search
				</div>
				<kbd
					class="-me-1 ms-3 inline-flex size-5 max-h-full items-center justify-center rounded border border-border px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70"
				>
					/
				</kbd>
			</Button>
		</div>
		<div class="px-4">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger class={buttonVariants({ variant: 'outline', size: 'icon' })}>
					<Sun
						class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
					/>
					<Moon
						class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
					/>
					<span class="sr-only">Toggle theme</span>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end">
					<DropdownMenu.Item onclick={() => setMode('light')}>Light</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => setMode('dark')}>Dark</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => resetMode()}>System</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</div>
</div>

<style>
	.chart-line-icon {
		overflow: visible;
		will-change: transform;
	}

	.line {
		stroke-dasharray: 17;
		stroke-dashoffset: 0;
		transition:
			stroke-dashoffset 0.3s ease,
			opacity 0.3s ease;
		transform: translateZ(0);
		will-change: stroke-dashoffset, opacity;
	}

	.chart-line-icon.animate .line {
		animation: lineAnimation 0.6s ease backwards;
		animation-fill-mode: forwards;
	}

	@keyframes lineAnimation {
		0% {
			stroke-dashoffset: 17;
			opacity: 1;
		}
		15% {
			stroke-dashoffset: 17;
			opacity: 0;
		}
		100% {
			stroke-dashoffset: 0;
			opacity: 1;
		}
	}
</style>
