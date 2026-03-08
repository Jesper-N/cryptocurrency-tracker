<script lang="ts">
	import type { CoinDetailResponse, PriceHistoryPoint } from '../../../lib/coin-types.js';
	import type { PageData } from './$types';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { TextMorph } from 'torph/svelte';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { scaleUtc } from 'd3-scale';
	import { curveMonotoneX } from 'd3-shape';
	import { Area, AreaChart, LinearGradient } from 'layerchart';
	import { animate } from 'motion';

	type ChartPoint = {
		date: Date;
		value: number;
	};

	let { data }: { data: PageData } = $props();

	let coin = $derived(data.coin);
	let history = $derived(data.history);
	let error = $state<string | null>(null);

	let chartData = $derived(
		history
			.map(
				(point: PriceHistoryPoint): ChartPoint => ({
					date: new Date(point.timestamp),
					value: parseFloat(point.price)
				})
			)
			.sort((a: ChartPoint, b: ChartPoint) => a.date.getTime() - b.date.getTime())
	);

	let yMin = $derived(
		chartData.length ? Math.min(...chartData.map((d: ChartPoint) => d.value)) * 0.998 : 0
	);
	let yMax = $derived(
		chartData.length ? Math.max(...chartData.map((d: ChartPoint) => d.value)) * 1.001 : 100
	);

	// Helper function to safely parse a float value
	function safeParseFloat(value: string | number | null | undefined): number {
		if (value === null || value === undefined) return 0;
		const num = parseFloat(value.toString());
		return isNaN(num) ? 0 : num;
	}

	function formatPrice(num: number, precision: number): string {
		return (
			'$' +
			num.toLocaleString('en-US', {
				minimumFractionDigits: precision,
				maximumFractionDigits: precision
			})
		);
	}

	function formatSupply(value: string | number | null | undefined): string {
		if (value === null || value === undefined) return '0';
		const num = parseFloat(value.toString());
		if (isNaN(num)) return '0';

		if (num >= 1e12) {
			// Trillion
			return (num / 1e12).toFixed(2) + ' T';
		} else if (num >= 1e9) {
			// Billion
			return (num / 1e9).toFixed(2) + ' B';
		} else if (num >= 1e6) {
			// Million
			return (num / 1e6).toFixed(2) + ' M';
		} else {
			// Less than a million
			return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
		}
	}

	// Fetch and update data for this specific coin
	async function fetchCoinData() {
		if (!coin?.slug) return;

		try {
			const response = await fetch(`/api/currencies/${coin.slug}`);

			if (!response.ok) {
				throw new Error(`API returned ${response.status}`);
			}

			const data = (await response.json()) as CoinDetailResponse;

			coin = data.coin;
			history = data.history;
			error = null;
		} catch (err: unknown) {
			console.error(`Error fetching coin data for ${coin.slug}:`, err);
			if (err instanceof Error) {
				error = err.message;
			} else {
				error = 'Failed to update cryptocurrency data';
			}
		}
	}

	// Fetch data every 30 seconds
	$effect(() => {
		if (coin?.slug) {
			const timer = setInterval(() => {
				void fetchCoinData();
			}, 30000);

			return () => clearInterval(timer);
		}
	});

	function animatePanel(node: HTMLElement) {
		animate(
			node,
			{ opacity: [0, 1] as any, transform: ['translateY(5px)', 'translateY(0px)'] as any },
			{ duration: 0.3, easing: 'ease-out' } as any
		);
	}

	function animateChart(node: HTMLElement) {
		animate(
			node,
			{ opacity: [0, 1] as any, transform: ['translateY(5px)', 'translateY(0px)'] as any },
			{ duration: 0.3, delay: 0.1, easing: 'ease-out' } as any
		);
	}
</script>

{#if error}
	<div class="flex h-full w-full items-center justify-center p-8">
		<div
			class="crosshair-corners crosshair-container flex flex-col items-center gap-y-4 p-8 text-center"
		>
			<p class="lbl-technical text-chart-3">Error loading data</p>
			<p class="val-technical text-chart-3">{error}</p>
			<button
				class="lbl-technical border-border hover:bg-muted/10 mt-4 border px-4 py-2 transition-colors"
				onclick={fetchCoinData}>Try Again</button
			>
		</div>
	</div>
{:else if !coin}
	<div class="flex h-full w-full items-center justify-center p-12">
		<div class="flex items-center gap-3">
			<span class="val-technical animate-pulse font-bold">_</span>
			<span class="lbl-technical text-muted-foreground">RECEIVING MARKET DATA...</span>
		</div>
	</div>
{:else}
	{@const priceNum = safeParseFloat(coin.currentPrice)}
	{@const isVerySmallPrice = priceNum > 0 && priceNum < 0.0001}
	{@const pricePrecision = isVerySmallPrice ? 8 : priceNum < 1 ? 4 : 2}
	{@const animatedPrice = isVerySmallPrice
		? `$${priceNum.toFixed(pricePrecision)}`
		: formatPrice(priceNum, pricePrecision)}
	{@const percentChange90d = safeParseFloat(coin.percentChange90d)}

	<div class="flex size-full grow flex-col pb-8 lg:flex-row">
		<!-- Side information panel -->
		<div
			use:animatePanel
			class="flex w-full shrink-0 flex-col p-4 opacity-0 lg:w-[400px] xl:w-[450px]"
		>
			<div
				class="crosshair-corners crosshair-container bg-background/80 flex h-full flex-col backdrop-blur-sm"
			>
				<div class="panel-border-b flex flex-col gap-y-6 p-6">
					<!-- Name, symbol and mc rank -->
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
							{#if priceNum === 0}
								<TextMorph text={animatedPrice} />
							{:else}
								{formatPrice(priceNum, pricePrecision)}
							{/if}
						</div>
						{#if coin.percentChange24h}
							<div
								class={`val-technical inline-flex items-center gap-1 font-medium ${parseFloat(coin.percentChange24h) >= 0 ? 'text-chart-2' : 'text-chart-3'}`}
							>
								{parseFloat(coin.percentChange24h) >= 0 ? '▲' : '▼'}
								{Math.abs(parseFloat(coin.percentChange24h)).toFixed(2)}% (24H)
							</div>
						{/if}
					</div>
				</div>

				<div class="grid grid-cols-2">
					<!-- Market Cap -->
					<div class="panel-border-b panel-border-r p-4">
						<div class="lbl-technical mb-2 cursor-default select-none">Market Cap</div>
						<div class="val-technical font-medium">{formatSupply(coin.marketCap)}</div>
					</div>

					<!-- Volume (24h) -->
					<div class="panel-border-b p-4">
						<div class="lbl-technical mb-2 cursor-default select-none">Volume (24h)</div>
						<div class="val-technical font-medium">{formatSupply(coin.volume24h)}</div>
					</div>

					<!-- Total supply -->
					<div class="panel-border-b panel-border-r p-4">
						<div class="lbl-technical mb-2 cursor-default select-none">Total supply</div>
						<div class="val-technical font-medium">
							{formatSupply(coin.circulatingSupply)}
							<span class="text-muted-foreground ml-1 text-[13px]">{coin.symbol}</span>
						</div>
					</div>

					<!-- Max supply -->
					<div class="panel-border-b p-4">
						<div class="lbl-technical mb-2 cursor-default select-none">Max. supply</div>
						<div class="val-technical font-medium">
							{formatSupply(coin.maxSupply)}
							<span class="text-muted-foreground ml-1 text-[13px]">{coin.symbol}</span>
						</div>
					</div>

					<!-- Date added -->
					<div class="panel-border-r p-4">
						<div class="lbl-technical mb-2 cursor-default select-none">Listing Date</div>
						<div class="val-technical font-medium">
							{new Date(coin.dateAdded)
								.toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'short',
									day: 'numeric'
								})
								.toUpperCase()}
						</div>
					</div>

					<!-- % change 90d -->
					<div class="p-4">
						<div class="lbl-technical mb-2 cursor-default select-none">Change (90d)</div>
						<div class="val-technical font-medium">
							<span class={percentChange90d >= 0 ? 'text-chart-2' : 'text-chart-3'}>
								{percentChange90d >= 0 ? '+' : ''}{percentChange90d.toFixed(2)}%
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Graph panel -->
		<div use:animateChart class="flex w-full flex-col p-4 opacity-0 lg:flex-1 lg:pl-0">
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
							data={chartData}
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
									labelFormatter={(v: Date) =>
										v.toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
											hour: '2-digit',
											minute: '2-digit'
										})}
								/>
							{/snippet}
							{#snippet marks({ series, getAreaProps })}
								{#each series as s, i (s.key)}
									<LinearGradient
										stops={[
											'var(--foreground)',
											'color-mix(in lch, var(--background) 100%, transparent)'
										]}
										vertical
									>
										{#snippet children({ gradient })}
											<Area {...getAreaProps(s, i)} fill={gradient} />
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
{/if}
