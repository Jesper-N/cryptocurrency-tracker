<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { compact, digits, money, num, pct, plot, price, stroke, tone } from '$lib/coin';
	import { live } from '$lib/live';
	import { enter } from '$lib/motion';
	import { TextMorph } from 'torph/svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import { scaleTime } from 'd3-scale';
	import { curveMonotoneX } from 'd3-shape';
	import { Chart, Spline, Svg } from 'layerchart';
	import type { PageData } from './$types';

	type Coin = PageData['coins'][number];

	const key = 'data:coins';
	const span = 75000;

	let { data }: { data: PageData } = $props();

	let coins = $derived(data.coins);

	function prep(coin: Coin) {
		const value = num(coin.currentPrice);
		const precision = digits(value);

		return {
			...coin,
			priceText:
				value > 0 && value < 0.0001 ? `$${value.toFixed(precision)}` : price(value, precision)
		};
	}

	let volume = $derived(
		[...coins]
			.filter((coin) => coin.volumeChange24h !== null)
			.sort((a, b) => num(b.volumeChange24h) - num(a.volumeChange24h))
			.slice(0, 5)
			.map((coin) => {
				const row = prep(coin);
				const metric = num(coin.volumeChange24h);

				return {
					...row,
					metric,
					metricText: `${metric.toFixed(2)}%`
				};
			})
	);

	let best = $derived(
		[...coins]
			.filter((coin) => coin.percentChange30d !== null && num(coin.percentChange30d) > 0.05)
			.sort((a, b) => num(b.percentChange30d) - num(a.percentChange30d))
			.slice(0, 5)
			.map((coin) => {
				const row = prep(coin);
				const metric = num(coin.percentChange30d);

				return {
					...row,
					metric,
					metricText: `${metric.toFixed(2)}%`
				};
			})
	);

	let worst = $derived(
		[...coins]
			.filter((coin) => coin.percentChange30d !== null)
			.sort((a, b) => num(a.percentChange30d) - num(b.percentChange30d))
			.slice(0, 5)
			.map((coin) => {
				const row = prep(coin);
				const metric = Math.abs(num(coin.percentChange30d));

				return {
					...row,
					metric,
					metricText: `${metric.toFixed(2)}%`
				};
			})
	);

	let cards = $derived([
		{
			title: 'Highest 24-Hour Volume Change',
			rows: volume,
			mark: '▲',
			kind: 'text-chart-2'
		},
		{
			title: 'Best 30-Day Performers',
			rows: best,
			mark: '▲',
			kind: 'text-chart-2'
		},
		{
			title: 'Worst 30-Day Performers',
			rows: worst,
			mark: '▼',
			kind: 'text-chart-3'
		}
	]);

	let rows = $derived(
		coins.map((coin) => {
			const value = num(coin.currentPrice);
			const precision = digits(value);
			const points = plot(coin.history);

			return {
				...coin,
				priceText:
					value > 0 && value < 0.0001 ? `$${value.toFixed(precision)}` : price(value, precision),
				percent1h: pct(coin.percentChange1h),
				percent24h: pct(coin.percentChange24h),
				percent7d: pct(coin.percentChange7d),
				tone1h: tone(coin.percentChange1h),
				tone24h: tone(coin.percentChange24h),
				tone7d: tone(coin.percentChange7d),
				marketText: money(coin.marketCap),
				volumeText: money(coin.volume24h),
				supplyText: compact(coin.circulatingSupply),
				points,
				line: stroke(points)
			};
		})
	);

	$effect(() => {
		if (!browser) {
			return;
		}

		return live(key, span);
	});
</script>

<div class="mt-8 flex flex-col gap-y-12 pb-12">
	<div class="px-4 opacity-0" use:enter={0}>
		<h2
			class="text-foreground mb-4 cursor-default text-[15px] font-bold tracking-widest uppercase select-none"
		>
			Trending Metrics
		</h2>
		<div class="crosshair-corners crosshair-container grid grid-cols-1 md:grid-cols-3">
			{#each cards as card, idx (card.title)}
				<div class={`flex flex-col ${idx !== cards.length - 1 ? 'md:panel-border-r' : ''}`}>
					<div class="panel-border-b bg-muted/10 cursor-default p-3 select-none">
						<h3 class="lbl-technical">{card.title}</h3>
					</div>
					<div class="flex flex-col space-y-4 p-4">
						{#each card.rows as row, rank (row.id)}
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<span class="text-muted-foreground w-4 text-[13px]">{rank + 1}</span>
									<a
										href={resolve(`/currencies/${row.slug}`)}
										class="group flex items-center gap-1"
									>
										<span class="val-technical font-medium group-hover:underline">{row.name}</span>
										<span class="text-muted-foreground text-[13px] tracking-wider uppercase">
											/{row.symbol}
										</span>
									</a>
								</div>
								<div class="text-right">
									<div class="val-technical font-medium">
										{#if rank === 0}
											<TextMorph text={row.priceText} />
										{:else}
											{row.priceText}
										{/if}
									</div>
									<div class={`text-[13px] tracking-wider ${card.kind}`}>
										{card.mark}
										{#if rank === 0}
											<TextMorph text={row.metricText} />
										{:else}
											{row.metricText}
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div use:enter={0.05} class="px-4 opacity-0">
		<h2
			class="text-foreground mb-4 cursor-default text-[15px] font-bold tracking-widest uppercase select-none"
		>
			Top Cryptocurrencies
		</h2>
		<div class="crosshair-corners crosshair-container">
			<Table.Root class="text-[15px]">
				<Table.Header class="bg-muted/10">
					<Table.Row class="border-border cursor-default select-none hover:bg-transparent">
						<Table.Head class="lbl-technical w-[50px] text-center">#</Table.Head>
						<Table.Head class="lbl-technical">Name</Table.Head>
						<Table.Head class="lbl-technical text-right">Price</Table.Head>
						<Table.Head class="lbl-technical text-right">1h %</Table.Head>
						<Table.Head class="lbl-technical text-right">24h %</Table.Head>
						<Table.Head class="lbl-technical text-right">7d %</Table.Head>
						<Table.Head class="lbl-technical text-right">Market Cap</Table.Head>
						<Table.Head class="lbl-technical text-right">Volume(24h)</Table.Head>
						<Table.Head class="lbl-technical text-right">Circulating Supply</Table.Head>
						<Table.Head class="lbl-technical w-[150px] text-center">Last Hour</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each rows as row (row.id)}
						<Table.Row
							class="border-border hover:bg-muted !cursor-pointer hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]"
							onclick={() => void goto(resolve(`/currencies/${row.slug}`))}
						>
							<Table.Cell class="text-muted-foreground text-center text-[13px]">
								{row.cmcRank}
							</Table.Cell>
							<Table.Cell>
								<span class="val-technical font-medium">{row.name}</span>
								<span class="text-muted-foreground ml-1 text-[13px] tracking-wider uppercase">
									{row.symbol}
								</span>
							</Table.Cell>
							<Table.Cell class="val-technical text-right font-medium">
								<TextMorph text={row.priceText} />
							</Table.Cell>
							<Table.Cell class={`text-right text-[13px] tracking-wider ${row.tone1h}`}>
								{row.percent1h}
							</Table.Cell>
							<Table.Cell class={`text-right text-[13px] tracking-wider ${row.tone24h}`}>
								{row.percent24h}
							</Table.Cell>
							<Table.Cell class={`text-right text-[13px] tracking-wider ${row.tone7d}`}>
								{row.percent7d}
							</Table.Cell>
							<Table.Cell class="val-technical text-right">{row.marketText}</Table.Cell>
							<Table.Cell class="val-technical text-muted-foreground text-right">
								{row.volumeText}
							</Table.Cell>
							<Table.Cell class="val-technical text-right">
								{row.supplyText}
								<span class="text-muted-foreground ml-1 text-[13px]">{row.symbol}</span>
							</Table.Cell>
							<Table.Cell class="py-2">
								{#if row.points.length > 1}
									<div class="h-10 w-full">
										<Chart
											data={row.points}
											x="date"
											xScale={scaleTime()}
											y="value"
											yDomain={[null, null]}
											padding={{ top: 2, bottom: 2, left: 0, right: 0 }}
										>
											<Svg>
												<g style="fill: none;">
													<Spline
														curve={curveMonotoneX}
														class={`${row.line} animate-draw-line stroke-[1.5px]`}
													/>
												</g>
											</Svg>
										</Chart>
									</div>
								{:else}
									<div
										class="text-muted-foreground flex h-10 w-full items-center justify-center text-[13px]"
									>
										--
									</div>
								{/if}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	</div>
</div>

<style>
	:global(.animate-draw-line) {
		stroke-dasharray: 1000;
		stroke-dashoffset: 1000;
		animation: drawLine 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	@keyframes drawLine {
		to {
			stroke-dashoffset: 0;
		}
	}
</style>
