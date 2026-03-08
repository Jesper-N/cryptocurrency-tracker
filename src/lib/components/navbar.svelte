<script lang="ts">
	import { resolve } from '$app/paths';
	import { Sun, Moon, Search } from '@lucide/svelte';
	import { resetMode, setMode } from 'mode-watcher';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<div
	class="border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50 flex w-full items-center justify-between border-b px-4 py-3 backdrop-blur-md"
>
	<div class="flex items-center">
		<a href={resolve('/')} class="flex items-center pr-8">
			<span
				class="bg-foreground text-background mr-2 px-1.5 py-0.5 text-xs font-bold tracking-widest uppercase"
				>CR</span
			>
			<p class="text-sm font-bold tracking-widest uppercase">Tracker</p>
		</a>

		<nav class="hidden gap-x-6 md:flex">
			<a
				href={resolve('/')}
				class="text-muted-foreground hover:text-foreground text-xs font-medium tracking-[0.15em] uppercase transition-colors"
			>
				Cryptocurrencies
			</a>
			<a
				href={resolve('/')}
				class="text-muted-foreground hover:text-foreground text-xs font-medium tracking-[0.15em] uppercase transition-colors"
			>
				DexScan
			</a>
			<a
				href={resolve('/')}
				class="text-muted-foreground hover:text-foreground text-xs font-medium tracking-[0.15em] uppercase transition-colors"
			>
				Exchanges
			</a>
			<a
				href={resolve('/')}
				class="text-muted-foreground hover:text-foreground text-xs font-medium tracking-[0.15em] uppercase transition-colors"
			>
				Community
			</a>
			<a
				href={resolve('/')}
				class="text-muted-foreground hover:text-foreground text-xs font-medium tracking-[0.15em] uppercase transition-colors"
			>
				Products
			</a>
		</nav>
	</div>

	<div class="flex items-center gap-2">
		<Button
			variant="outline"
			size="sm"
			class="border-border text-muted-foreground hidden h-8 w-64 justify-between rounded-none md:flex"
		>
			<div class="flex items-center text-xs tracking-widest uppercase">
				<Search class="-ms-1 me-2" size={14} strokeWidth={2} aria-hidden="true" />
				Search
			</div>
			<kbd
				class="border-border bg-muted inline-flex h-5 items-center justify-center border px-1.5 font-[inherit] text-[0.6rem] font-medium"
			>
				/
			</kbd>
		</Button>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class={buttonVariants({
					variant: 'outline',
					size: 'icon',
					class: 'border-border h-8 w-8 rounded-none'
				})}
			>
				<Sun
					class="h-[1rem] w-[1rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
				/>
				<Moon
					class="absolute h-[1rem] w-[1rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
				/>
				<span class="sr-only">Toggle theme</span>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="border-border rounded-none">
				<DropdownMenu.Item
					class="rounded-none text-xs tracking-wider uppercase"
					onclick={() => setMode('light')}>Light</DropdownMenu.Item
				>
				<DropdownMenu.Item
					class="rounded-none text-xs tracking-wider uppercase"
					onclick={() => setMode('dark')}>Dark</DropdownMenu.Item
				>
				<DropdownMenu.Item
					class="rounded-none text-xs tracking-wider uppercase"
					onclick={() => resetMode()}>System</DropdownMenu.Item
				>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</div>
