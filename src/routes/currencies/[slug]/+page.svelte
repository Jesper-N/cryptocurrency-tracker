<script lang="ts">
	import { browser } from '$app/environment';
	import { compact, digits, num, plot, price, stamp, tone } from '$lib/coin';
	import { live } from '$lib/live';
	import { enter } from '$lib/motion';
	import { TextMorph } from 'torph/svelte';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { scaleUtc } from 'd3-scale';
	import { curveMonotoneX } from 'd3-shape';
	import { Area, AreaChart, LinearGradient } from 'layerchart';
	import type { PageData } from './$types';

	const span = 75000;

	let { data }: { data: PageData } = $props();

	let coin = $derived(data.coin);
	let history = $derived(data.history);
	let points = $derived(plot(history));
	let band = $derived(
		points.reduce(
			(acc, point) => ({
				min: Math.min(acc.min, point.value),
				max: Math.max(acc.max, point.value)
			}),
			{ min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY }
		)
	);
	let yMin = $derived(points.length ? band.min * 0.998 : 0);
	let yMax = $derived(points.length ? band.max * 1.001 : 100);
	let value = $derived(num(coin.currentPrice));
	let precision = $derived(digits(value));
	let priceText = $derived(
		value > 0 && value < 0.0001 ? `$${value.toFixed(precision)}` : price(value, precision)
	);
	let change24h = $derived(num(coin.percentChange24h));
	let change90d = $derived(num(coin.percentChange90d));
	let marketText = $derived(compact(coin.marketCap));
	let volumeText = $derived(compact(coin.volume24h));
	let circText = $derived(compact(coin.circulatingSupply));
	let maxText = $derived(compact(coin.maxSupply));
	let dateText = $derived(stamp(coin.dateAdded));

	$effect(() => {
		if (!browser) {
			return;
		}

		return live(`data:coin:${coin.slug}`, span);
	});
</script>

<div class="flex size-full grow flex-col pb-8 lg:flex-row">
	<div use:enter={0} class="flex w-full shrink-0 flex-col p-4 opacity-0 lg:w-[400px] xl:w-[450px]">
		<div
			class="crosshair-corners crosshair-container bg-background/80 flex h-full flex-col backdrop-blur-sm"
		>
			<div class="panel-border-b flex flex-col gap-y-6 p-6">
				<div class="flex cursor-default items-baseline gap-x-3 select-none">
					<h1 class="val-technical text-3xl font-bold uppercase">{coin.name}</h1>
					<h2 class="lbl-technical">{coin.symbol}</h2>
					<span
						class="border-border text-foreground bg-muted/10 ml-auto border px-2 py-0.5 text-[0.7125rem] font-medium tracking-widest uppercase"
					>
						Rank {coin.cmcRank}
					</span>
				</div>

				<div class="flex flex-wrap items-center gap-6">
					<div class="text-foreground text-4xl font-medium tracking-tight">
						{#if value === 0}
							<TextMorph text={priceText} />
						{:else}
							{priceText}
						{/if}
					</div>
					{#if coin.percentChange24h}
						<div
							class={`val-technical inline-flex items-center gap-1 font-medium ${tone(change24h)}`}
						>
							{change24h >= 0 ? '▲' : '▼'}
							{Math.abs(change24h).toFixed(2)}% (24H)
						</div>
					{/if}
				</div>
			</div>

			<div class="grid grid-cols-2">
				<div class="panel-border-b panel-border-r p-4">
					<div class="lbl-technical mb-2 cursor-default select-none">Market Cap</div>
					<div class="val-technical font-medium">{marketText}</div>
				</div>

				<div class="panel-border-b p-4">
					<div class="lbl-technical mb-2 cursor-default select-none">Volume (24h)</div>
					<div class="val-technical font-medium">{volumeText}</div>
				</div>

				<div class="panel-border-b panel-border-r p-4">
					<div class="lbl-technical mb-2 cursor-default select-none">Total supply</div>
					<div class="val-technical font-medium">
						{circText}
						<span class="text-muted-foreground ml-1 text-[13px]">{coin.symbol}</span>
					</div>
				</div>

				<div class="panel-border-b p-4">
					<div class="lbl-technical mb-2 cursor-default select-none">Max. supply</div>
					<div class="val-technical font-medium">
						{maxText}
						<span class="text-muted-foreground ml-1 text-[13px]">{coin.symbol}</span>
					</div>
				</div>

				<div class="panel-border-r p-4">
					<div class="lbl-technical mb-2 cursor-default select-none">Listing Date</div>
					<div class="val-technical font-medium">{dateText}</div>
				</div>

				<div class="p-4">
					<div class="lbl-technical mb-2 cursor-default select-none">Change (90d)</div>
					<div class="val-technical font-medium">
						<span class={tone(change90d)}>{change90d >= 0 ? '+' : ''}{change90d.toFixed(2)}%</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div use:enter={0.1} class="flex w-full flex-col p-4 opacity-0 lg:flex-1 lg:pl-0">
		<div
			class="crosshair-corners crosshair-container bg-background/80 flex size-full grow flex-col backdrop-blur-sm"
		>
			<div class="panel-border-b flex items-end justify-between p-6">
				<div>
					<h2 class="lbl-technical mb-1 cursor-default select-none">{coin.name} / USD</h2>
					<div
						class="text-foreground cursor-default text-[15px] font-medium tracking-widest uppercase select-none"
					>
						Last 30D Price Action
					</div>
				</div>
			</div>
			<div class="min-h-[300px] flex-grow p-6 md:min-h-[500px]">
				<Chart.Container
					config={{
						value: { label: 'Price', color: 'var(--foreground)' }
					}}
					class="h-full w-full"
				>
					<AreaChart
						data={points}
						x="date"
						xScale={scaleUtc()}
						yDomain={[yMin, yMax]}
						yNice
						grid={{ x: true, y: true }}
						series={[
							{
								key: 'value',
								label: 'Price',
								color: 'var(--foreground)'
							}
						]}
						props={{
							area: {
								curve: curveMonotoneX,
								'fill-opacity': 0.15,
								motion: 'tween',
								strokeWidth: 2
							},
							grid: {
								class: 'stroke-border stroke-dasharray-[2,2] stroke-opacity-50'
							},
							xAxis: {
								tickLength: 4,
								ticks: 6,
								classes: {
									tickLabel: 'text-[0.6rem] uppercase tracking-widest fill-muted-foreground'
								}
							},
							yAxis: {
								format: () => '',
								tickLength: 4,
								ticks: 5,
								classes: {
									tickLabel: 'text-[0.6rem] uppercase tracking-widest fill-muted-foreground'
								}
							}
						}}
					>
						{#snippet tooltip()}
							<Chart.Tooltip
								indicator="line"
								class="border-border bg-background rounded-none font-mono text-[13px] tracking-wider uppercase shadow-none"
								labelFormatter={(value: Date) =>
									value.toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric',
										hour: '2-digit',
										minute: '2-digit'
									})}
							/>
						{/snippet}
						{#snippet marks({ series, getAreaProps })}
							{#each series as item, idx (item.key)}
								<LinearGradient
									stops={[
										'var(--foreground)',
										'color-mix(in lch, var(--background) 100%, transparent)'
									]}
									vertical
								>
									{#snippet children({ gradient })}
										<Area {...getAreaProps(item, idx)} fill={gradient} />
									{/snippet}
								</LinearGradient>
							{/each}
						{/snippet}
					</AreaChart>
				</Chart.Container>
			</div>
		</div>
	</div>
</div>
