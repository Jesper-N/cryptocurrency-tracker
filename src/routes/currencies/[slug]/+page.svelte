<script lang="ts">
	import type { PriceHistoryPoint } from '$lib/types';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import NumberFlow, { continuous } from '@number-flow/svelte';
	import { format, PeriodType } from '@layerstack/utils';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { scaleUtc } from 'd3-scale';
	import { curveMonotoneX } from 'd3-shape';
	import { Area, AreaChart, LinearGradient } from 'layerchart';

	const { data } = $props();

	let coin = $derived(data?.coin);
	let history = $derived(data?.history || []);
	let error = $derived<string | null>(data?.error || null);

	let chartData = $derived(
		history
			.map((point: PriceHistoryPoint) => ({
				date: new Date(point.timestamp),
				value: parseFloat(point.price)
			}))
			.sort((a, b) => a.date.getTime() - b.date.getTime())
	);

	let yMin = $derived(chartData.length ? Math.min(...chartData.map((d) => d.value)) * 0.998 : 0);
	let yMax = $derived(chartData.length ? Math.max(...chartData.map((d) => d.value)) * 1.001 : 100);

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

	function formatSupply(value: string | number | null): string {
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

			const data = await response.json();

			// Update component state with new data
			coin = data.coin;
			history = data.history;
			error = null; //
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
		console.log(chartData);
		if (coin?.slug) {
			const timer = setInterval(() => {
				fetchCoinData();
			}, 30000);

			// Cleanup function that runs when component is destroyed
			return () => clearInterval(timer);
		}
	});
</script>

{#if error}
	<p class="error">Error loading data: {error}</p>
	<button onclick={fetchCoinData}>Try Again</button>
{:else if !coin}
	<p>Loading coin data...</p>
{:else}
	<div class="flex size-full grow">
		<!-- Side information panel -->
		<div class="border-muted w-1/3 border-r">
			<div class="flex flex-col gap-y-6 p-4">
				<!-- Name, symbol and mc rank -->
				<div class="flex items-baseline gap-x-2">
					<h1 class="text-4xl">
						{coin.name}
					</h1>
					<h2 class="text-muted-foreground text-lg">{coin.symbol}</h2>
					<Badge>#{coin.cmcRank}</Badge>
				</div>

				<div class="flex flex-wrap items-center gap-2">
					<div class="text-3xl font-bold">
						{#if coin.currentPrice}
							{@const priceNum = safeParseFloat(coin.currentPrice)}
							{@const isVerySmallPrice = priceNum > 0 && priceNum < 0.0001}
							{@const pricePrecision = isVerySmallPrice ? 8 : priceNum < 1 ? 4 : 2}
							{#if coin.currentPrice === 0}
								<!-- Only use NumberFlow for the first item in each card -->
								{#if isVerySmallPrice}
									${priceNum.toFixed(pricePrecision)}
								{:else}
									<NumberFlow
										willChange
										plugins={[continuous]}
										value={priceNum}
										precision={pricePrecision}
										localeString={priceNum >= 1000}
										prefix="$"
										fixedDecimals={true}
									/>
								{/if}
							{:else}
								<!-- Use static formatting for other items -->
								{formatPrice(priceNum, pricePrecision)}
							{/if}
						{/if}
					</div>
					{#if coin.percentChange24h}
						<span
							class={`text-xs ${parseFloat(coin.percentChange24h) >= 0 ? 'text-green-600' : 'text-red-600'}`}
						>
							{parseFloat(coin.percentChange24h) >= 0 ? '▲' : '▼'}
							{Math.abs(parseFloat(coin.percentChange24h)).toFixed(2)}% (24h)
						</span>
					{/if}
				</div>

				<div class="grid grid-cols-1 grid-rows-3 gap-4 md:grid-cols-2">
					<!-- Market Cap -->
					<div class="bg-card border-border rounded-lg border p-2 text-center shadow-sm">
						<div class="text-muted-foreground text-xs">Market Cap</div>
						<div class="text-lg font-semibold">
							{formatSupply(coin.marketCap)}
						</div>
					</div>

					<!-- Volume (24h) -->
					<div class="bg-card border-border rounded-lg border p-2 text-center shadow-sm">
						<div class="text-muted-foreground text-xs">Volume (24h)</div>
						<div class="text-lg font-semibold">
							{formatSupply(coin.volume24h)}
						</div>
					</div>

					<!-- Total supply -->
					<div class="bg-card border-border rounded-lg border p-2 text-center shadow-sm">
						<div class="text-muted-foreground text-xs">Total supply</div>
						<div class="text-lg font-semibold">
							{formatSupply(coin.circulatingSupply)}
							{coin.symbol}
						</div>
					</div>

					<!-- Max supply -->
					<div class="bg-card border-border rounded-lg border p-2 text-center shadow-sm">
						<div class="text-muted-foreground text-xs">Max. supply</div>
						<div class="text-lg font-semibold">
							{formatSupply(coin.maxSupply)}
							{coin.symbol}
						</div>
					</div>

					<!-- Date added -->
					<div class="bg-card border-border rounded-lg border p-2 text-center shadow-sm">
						<div class="text-muted-foreground text-xs">Date added</div>
						<div class="text-lg font-semibold">
							{new Date(coin.dateAdded).toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'short'
							})}
						</div>
					</div>

					<!-- % change 90d -->
					<div class="bg-card border-border rounded-lg border p-2 text-center shadow-sm">
						<div class="text-muted-foreground text-xs">Percent change (90d)</div>
						<div class="text-lg font-semibold">
							<span
								class={`${parseFloat(coin.percentChange90d) >= 0 ? 'text-green-600' : 'text-red-600'}`}
							>
								{parseFloat(coin.percentChange90d) >= 0 ? '▲' : '▼'}
								{Math.abs(parseFloat(coin.percentChange90d)).toFixed(2)}%
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Graph panel -->
		<div class="flex size-full grow p-2">
			<Card.Root class="w-full">
				<Card.Header>
					<Card.Title>{coin?.name} Price</Card.Title>
					<Card.Description>Last 30D price history</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="h-[200px] w-full md:h-[350px] lg:h-[500px]">
						<Chart.Container
							config={{
								value: { label: 'Price', color: 'var(--chart-1)' }
							}}
							class="h-full w-full"
						>
							<AreaChart
								data={chartData}
								x="date"
								xScale={scaleUtc()}
								yDomain={[yMin, yMax]}
								yNice
								padding={{ top: 10, bottom: 30, left: 0, right: 0 }}
								series={[
									{
										key: 'value',
										label: 'Price',
										color: 'var(--color-primary)'
									}
								]}
								props={{
									area: {
										curve: curveMonotoneX,
										'fill-opacity': 0.4,
										motion: 'tween'
									},
									xAxis: {
										format: (v: Date) =>
											v.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
									},
									yAxis: {
										format: () => ''
									}
								}}
							>
								{#snippet tooltip()}
									<Chart.Tooltip
										indicator="line"
										labelFormatter={(v: Date) =>
											v.toLocaleDateString('en-US', {
												month: 'long',
												day: 'numeric',
												year: 'numeric',
												hour: '2-digit',
												minute: '2-digit'
											})}
									/>
								{/snippet}
								{#snippet marks({ series, getAreaProps })}
									{#each series as s, i (s.key)}
										<LinearGradient
											stops={[
												'var(--color-primary)',
												'color-mix(in lch, var(--color-primary) 10%, transparent)'
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
				</Card.Content>
			</Card.Root>
		</div>
	</div>
{/if}
