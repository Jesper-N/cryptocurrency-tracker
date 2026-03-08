<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Chart, Svg, Spline } from 'layerchart';
	import { scaleTime } from 'd3-scale';
	import { curveMonotoneX } from 'd3-shape';
	import { animate } from 'motion';
	import { TextMorph } from 'torph/svelte';
	import type { CoinsResponse } from '../lib/coin-types.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let coins = $derived(data.coins);
	let error = $derived(data.error ?? null);

	// --- Helper Function ---
	function safeParseFloat(value: string | number | null | undefined): number {
		if (value === null || value === undefined) return 0;
		const num = parseFloat(value.toString());
		return isNaN(num) ? 0 : num;
	}

	// --- Formatting functions for the main table ---

	// Formats percentages with 2 decimals and a % sign
	function formatPercentage(value: string | number | null | undefined): string {
		if (value === null || value === undefined) return '0.00%';
		const num = parseFloat(value.toString());
		if (isNaN(num)) return '0.00%';
		return num.toFixed(2) + '%';
	}

	// Formats large currency values (like Market Cap, Volume) without decimals
	function formatLargeCurrency(value: string | number | null | undefined): string {
		if (value === null || value === undefined) return '$0';
		const num = parseFloat(value.toString());
		if (isNaN(num)) return '$0';
		// Use basic toLocaleString just for comma grouping, no decimals
		return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 0 });
	}

	// Formats circulating supply with abbreviations (M, B, T)
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

	// Format price with appropriate precision
	function formatPrice(num: number, precision: number): string {
		return (
			'$' +
			num.toLocaleString('en-US', {
				minimumFractionDigits: precision,
				maximumFractionDigits: precision
			})
		);
	}

	// Format coin history data so it works with the chart library
	function prepareChartData(
		history: { timestamp: string | Date; price: string | number }[] | undefined
	): { date: Date; value: number }[] {
		if (!history || history.length < 2) {
			return [];
		}
		return history.map((entry) => ({
			date: new Date(entry.timestamp),
			value: parseFloat(entry.price.toString())
		}));
	}

	// --- Fetch Function ---
	async function fetchCoins() {
		try {
			// Fetch the main list endpoint
			const response = await fetch('/api/currencies');

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					(errorData as { error?: string }).error ?? `API returned ${String(response.status)}`
				);
			}

			const data = (await response.json()) as CoinsResponse;

			coins = data.coins;
			error = null;
		} catch (err: unknown) {
			console.error('Error fetching coin data:', err);
			if (err instanceof Error) {
				error = err.message;
			} else {
				error = 'Failed to update cryptocurrency data';
			}
		}
	}

	// Fetch data every 30 seconds
	$effect(() => {
		const timer = setInterval(() => {
			void fetchCoins();
		}, 30000);

		// Cleanup function
		return () => clearInterval(timer);
	});

	// Svelte action for stagger animation on elements
	function animateIn(node: HTMLElement, index: number) {
		animate(
			node,
			{ opacity: [0, 1] as any, transform: ['translateY(5px)', 'translateY(0px)'] as any },
			{ delay: index * 0.05, duration: 0.3, easing: 'ease-out' } as any
		);
	}
</script>

<div class="mt-8 flex flex-col gap-y-12 pb-12">
	<!-- Trending Cards Section -->
	<div class="px-4 opacity-0" use:animateIn={0}>
		<h2
			class="text-foreground mb-4 cursor-default text-[15px] font-bold tracking-widest uppercase select-none"
		>
			Trending Metrics
		</h2>

		{#if coins.length > 0}
			{@const cardConfigs = [
				{
					title: 'Highest 24-Hour Volume Change',
					getData: () =>
						[...coins]
							.filter((coin) => coin.volumeChange24h !== null)
							.sort((a, b) => safeParseFloat(b.volumeChange24h) - safeParseFloat(a.volumeChange24h))
							.slice(0, 5),
					getMetricValue: (coin: (typeof coins)[0]) => safeParseFloat(coin.volumeChange24h),
					isPositive: true
				},
				{
					title: 'Best 30-Day Performers',
					getData: () =>
						[...coins]
							.filter(
								(coin) =>
									coin.percentChange30d !== null && safeParseFloat(coin.percentChange30d) > 0.05
							)
							.sort(
								(a, b) => safeParseFloat(b.percentChange30d) - safeParseFloat(a.percentChange30d)
							)
							.slice(0, 5),
					getMetricValue: (coin: (typeof coins)[0]) => safeParseFloat(coin.percentChange30d),
					isPositive: true
				},
				{
					title: 'Worst 30-Day Performers',
					getData: () =>
						[...coins]
							.filter((coin) => coin.percentChange30d !== null)
							.sort(
								(a, b) => safeParseFloat(a.percentChange30d) - safeParseFloat(b.percentChange30d)
							)
							.slice(0, 5),
					getMetricValue: (coin: (typeof coins)[0]) =>
						Math.abs(safeParseFloat(coin.percentChange30d)),
					isPositive: false
				}
			] as const}

			<div class="crosshair-corners crosshair-container grid grid-cols-1 md:grid-cols-3">
				{#each cardConfigs as config, j (config.title)}
					{@const cardData = config.getData()}
					<div class="flex flex-col {j !== 2 ? 'md:panel-border-r' : ''}">
						<div class="panel-border-b bg-muted/10 cursor-default p-3 select-none">
							<h3 class="lbl-technical">{config.title}</h3>
						</div>
						<div class="flex flex-col space-y-4 p-4">
							{#each cardData as coin, i (coin.id)}
								{@const priceNum = safeParseFloat(coin.currentPrice)}
								{@const isVerySmallPrice = priceNum > 0 && priceNum < 0.0001}
								{@const pricePrecision = isVerySmallPrice ? 8 : priceNum < 1 ? 4 : 2}
								{@const metricValue = config.getMetricValue(coin)}
								{@const animatedPrice = isVerySmallPrice
									? `$${priceNum.toFixed(pricePrecision)}`
									: formatPrice(priceNum, pricePrecision)}
								{@const animatedMetric = `${metricValue.toFixed(2)}%`}
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-3">
										<span class="text-muted-foreground w-4 text-[13px]">{i + 1}</span>
										<a
											href={resolve(`/currencies/${coin.slug}`)}
											class="group flex items-center gap-1"
										>
											<span class="val-technical font-medium group-hover:underline"
												>{coin.name}</span
											>
											<span class="text-muted-foreground text-[13px] tracking-wider uppercase"
												>/{coin.symbol}</span
											>
										</a>
									</div>
									<div class="text-right">
										<div class="val-technical font-medium">
											{#if i === 0}
												<TextMorph text={animatedPrice} />
											{:else}
												{formatPrice(priceNum, pricePrecision)}
											{/if}
										</div>
										<div
											class="text-[13px] tracking-wider {config.isPositive
												? 'text-chart-2'
												: 'text-chart-3'}"
										>
											{config.isPositive ? '▲' : '▼'}
											{#if i === 0}
												<TextMorph text={animatedMetric} />
											{:else}
												{metricValue.toFixed(2)}%
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Main Table Card -->
	{#if coins.length > 0}
		<div use:animateIn={1} class="px-4 opacity-0">
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
						{#each coins as coin, i (coin.id)}
							{@const chartData = prepareChartData(coin.history)}
							{@const chartColorClass = (() => {
								if (chartData.length < 2) return 'stroke-foreground';
								const firstPrice = chartData[0].value;
								const lastPrice = chartData[chartData.length - 1].value;
								if (lastPrice > firstPrice) return 'stroke-chart-2';
								else if (lastPrice < firstPrice) return 'stroke-chart-3';
								else return 'stroke-foreground';
							})()}
							{@const priceNum = safeParseFloat(coin.currentPrice)}
							{@const isVerySmallPrice = priceNum > 0 && priceNum < 0.0001}
							{@const pricePrecision = isVerySmallPrice ? 8 : priceNum < 1 ? 4 : 2}
							{@const animatedPrice = isVerySmallPrice
								? `$${priceNum.toFixed(pricePrecision)}`
								: formatPrice(priceNum, pricePrecision)}

							<Table.Row
								class="border-border hover:bg-muted !cursor-pointer hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]"
								onclick={() => void goto(resolve(`/currencies/${coin.slug}`))}
							>
								<Table.Cell class="text-muted-foreground text-center text-[13px]"
									>{coin.cmcRank}</Table.Cell
								>
								<Table.Cell>
									<span class="val-technical font-medium">{coin.name}</span>
									<span class="text-muted-foreground ml-1 text-[13px] tracking-wider uppercase"
										>{coin.symbol}</span
									>
								</Table.Cell>
								<Table.Cell class="val-technical text-right font-medium">
									<TextMorph text={animatedPrice} />
								</Table.Cell>
								<Table.Cell
									class="text-right text-[13px] tracking-wider {safeParseFloat(
										coin.percentChange1h
									) >= 0
										? 'text-chart-2'
										: 'text-chart-3'}"
								>
									{formatPercentage(coin.percentChange1h)}
								</Table.Cell>
								<Table.Cell
									class="text-right text-[13px] tracking-wider {safeParseFloat(
										coin.percentChange24h
									) >= 0
										? 'text-chart-2'
										: 'text-chart-3'}"
								>
									{formatPercentage(coin.percentChange24h)}
								</Table.Cell>
								<Table.Cell
									class="text-right text-[13px] tracking-wider {safeParseFloat(
										coin.percentChange7d
									) >= 0
										? 'text-chart-2'
										: 'text-chart-3'}"
								>
									{formatPercentage(coin.percentChange7d)}
								</Table.Cell>
								<Table.Cell class="val-technical text-right"
									>{formatLargeCurrency(coin.marketCap)}</Table.Cell
								>
								<Table.Cell class="val-technical text-muted-foreground text-right"
									>{formatLargeCurrency(coin.volume24h)}</Table.Cell
								>
								<Table.Cell class="val-technical text-right"
									>{formatSupply(coin.circulatingSupply)}
									<span class="text-muted-foreground ml-1 text-[13px]">{coin.symbol}</span>
								</Table.Cell>
								<Table.Cell class="py-2">
									{#if chartData.length > 1}
										<div class="h-10 w-full">
											<Chart
												data={chartData}
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
															class="{chartColorClass} animate-draw-line stroke-[1.5px]"
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
	{:else if error}
		<p class="text-chart-3 m-4">{error}</p>
		<Button
			onclick={fetchCoins}
			variant="outline"
			class="border-border rounded-none tracking-widest uppercase">Try Again</Button
		>
	{:else}
		<p class="lbl-technical m-4 animate-pulse">Loading data stream...</p>
	{/if}
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
