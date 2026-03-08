<script lang="ts">
	import { resolve } from '$app/paths';
	import { Sun, Moon, Search } from '@lucide/svelte';
	import { resetMode, setMode } from 'mode-watcher';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<div
	class="border-muted bg-background/80 sticky top-0 z-50 flex w-full items-center justify-between border-b py-4 backdrop-blur-md"
>
	<div class="flex items-center px-4">
		<a href={resolve('/')} class="flex items-center pr-8">
			<p class="text-xl font-medium">CR Tracker</p>
		</a>

		<nav class="flex gap-x-6">
			<a href={resolve('/')} class="hover:text-primary text-sm font-medium transition-colors">
				Cryptocurrencies
			</a>
			<a href={resolve('/')} class="hover:text-primary text-sm font-medium transition-colors">
				DexScan
			</a>
			<a href={resolve('/')} class="hover:text-primary text-sm font-medium transition-colors">
				Exchanges
			</a>
			<a href={resolve('/')} class="hover:text-primary text-sm font-medium transition-colors">
				Community
			</a>
			<a href={resolve('/')} class="hover:text-primary text-sm font-medium transition-colors">
				Products
			</a>
		</nav>
	</div>

	<div class="flex justify-center">
		<div>
			<Button variant="outline" class="border-border w-64 justify-between rounded-none">
				<div class="flex items-center">
					<Search class="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
					Search
				</div>
				<kbd
					class="border-border text-muted-foreground/70 ms-3 -me-1 inline-flex size-5 max-h-full items-center justify-center border px-1 font-[inherit] text-[0.625rem] font-medium"
				>
					/
				</kbd>
			</Button>
		</div>
		<div class="px-4">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger
					class={buttonVariants({
						variant: 'outline',
						size: 'icon',
						class: 'border-border rounded-none'
					})}
				>
					<Sun
						class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
					/>
					<Moon
						class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
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
