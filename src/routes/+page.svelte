<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Chart, Svg, Spline } from 'layerchart';
	import { scaleTime } from 'd3-scale';
	import NumberFlow, { continuous } from '@number-flow/svelte';

	const { data: initialData } = $props();

	let coins = $state(initialData?.coins || []);
	let error = $state<string | null>(initialData?.error || null);

	// --- Helper Function ---
	function safeParseFloat(value: string | number | null | undefined): number {
		if (value === null || value === undefined) return 0;
		const num = parseFloat(value.toString());
		return isNaN(num) ? 0 : num;
	}

	// --- Formatting functions for the main table ---

	// Formats percentages with 2 decimals and a % sign
	function formatPercentage(value: string | number | null): string {
		if (value === null || value === undefined) return '0.00%';
		const num = parseFloat(value.toString());
		if (isNaN(num)) return '0.00%';
		return num.toFixed(2) + '%';
	}

	// Formats large currency values (like Market Cap, Volume) without decimals
	function formatLargeCurrency(value: string | number | null): string {
		if (value === null || value === undefined) return '$0';
		const num = parseFloat(value.toString());
		if (isNaN(num)) return '$0';
		// Use basic toLocaleString just for comma grouping, no decimals
		return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 0 });
	}

	// Formats circulating supply with abbreviations (M, B, T)
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
	) {
		if (!history || history.length < 2) {
			return [];
		}
		return history.map((entry) => ({
			date: new Date(entry.timestamp),
			value: parseFloat(entry.price?.toString() || '0')
		}));
	}

	// --- Fetch Function ---
	async function fetchCoins() {
		try {
			// Fetch the main list endpoint
			const response = await fetch('/api/currencies');

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData?.error || `API returned ${response.status}`);
			}

			const data = await response.json();

			coins = data.coins;
			error = null; // Clear error on success
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
			fetchCoins();
		}, 30000);

		// Cleanup function
		return () => clearInterval(timer);
	});

	// Format for compact notation
	const compactFormat = {
		notation: 'compact',
		compactDisplay: 'short',
		roundingMode: 'trunc'
	};
</script>

<div class="mt-8 flex flex-col gap-y-4">
	<!-- Trending Cards Section -->
	<div>
		<h2 class="mb-4 ml-4 text-2xl font-bold">Trending Metrics</h2>

		<div class="grid grid-cols-1 gap-4 px-4 md:grid-cols-3">
			{#if coins.length > 0}
				{@const cardConfigs = [
					{
						title: 'Highest 24-Hour Volume Change',
						getData: () =>
							[...coins]
								.filter(
									(coin) => coin.volumeChange24h !== null && coin.volumeChange24h !== undefined
								)
								.sort((a, b) => parseFloat(b.volumeChange24h) - parseFloat(a.volumeChange24h))
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
										coin.percentChange30d !== null &&
										coin.percentChange30d !== undefined &&
										parseFloat(coin.percentChange30d) > 0
								)
								.sort((a, b) => parseFloat(b.percentChange30d) - parseFloat(a.percentChange30d))
								.slice(0, 5),
						getMetricValue: (coin: (typeof coins)[0]) => safeParseFloat(coin.percentChange30d),
						isPositive: true
					},
					{
						title: 'Worst 30-Day Performers',
						getData: () =>
							[...coins]
								.filter(
									(coin) => coin.percentChange30d !== null && coin.percentChange30d !== undefined
									// Remove the condition that requires negative change
								)
								.sort((a, b) => parseFloat(a.percentChange30d) - parseFloat(b.percentChange30d))
								.slice(0, 5),
						getMetricValue: (coin: (typeof coins)[0]) =>
							Math.abs(safeParseFloat(coin.percentChange30d)),
						isPositive: false
					}
				] as const}

				{#each cardConfigs as config}
					{@const cardData = config.getData()}
					<Card.Root class="overflow-hidden">
						<Card.Header class="pb-2">
							<Card.Title class="text-xl">{config.title}</Card.Title>
						</Card.Header>
						<Card.Content class="pt-0">
							<div class="space-y-4">
								{#each cardData as coin, i}
									{@const priceNum = safeParseFloat(coin.currentPrice)}
									{@const isVerySmallPrice = priceNum > 0 && priceNum < 0.0001}
									{@const pricePrecision = isVerySmallPrice ? 8 : priceNum < 1 ? 4 : 2}
									{@const metricValue = config.getMetricValue(coin)}
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-3">
											<span class="w-6 text-lg text-muted-foreground">{i + 1}</span>
											<a
												href={`/currencies/${coin.slug}`}
												class="flex items-center gap-1 hover:underline"
											>
												<span class="font-semibold">{coin.name}</span>
												<span class="text-muted-foreground">/{coin.symbol}</span>
											</a>
										</div>
										<div class="text-right">
											<div class="font-semibold">
												{#if i === 0}
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
											</div>
											<div class="text-sm {config.isPositive ? 'text-green-600' : 'text-red-600'}">
												{config.isPositive ? '▲' : '▼'}
												{#if i === 0}
													<NumberFlow
														willChange
														plugins={[continuous]}
														value={metricValue}
														precision={2}
														suffix="%"
														fixedDecimals={true}
													/>
												{:else}
													{metricValue.toFixed(2)}%
												{/if}
											</div>
										</div>
									</div>
								{/each}
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Main Table Card -->
	{#if coins?.length > 0}
		<Card.Root class="m-4">
			<Card.Header>
				<Card.Title>Top Cryptocurrencies by Market Cap</Card.Title>
			</Card.Header>
			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>#</Table.Head>
							<Table.Head>Name</Table.Head>
							<Table.Head>Price</Table.Head>
							<Table.Head>1h %</Table.Head>
							<Table.Head>24h %</Table.Head>
							<Table.Head>7d %</Table.Head>
							<Table.Head>Market Cap</Table.Head>
							<Table.Head>Volume(24h)</Table.Head>
							<Table.Head>Circulating Supply</Table.Head>
							<Table.Head>Last Hour</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each coins as coin (coin.id)}
							{@const chartData = prepareChartData(coin.history)}
							{@const chartColorClass = (() => {
								if (chartData.length < 2) {
									return 'stroke-primary';
								}
								const firstPrice = chartData[0].value;
								const lastPrice = chartData[chartData.length - 1].value;

								if (lastPrice > firstPrice) {
									return 'stroke-green-600';
								} else if (lastPrice < firstPrice) {
									return 'stroke-red-600';
								} else {
									return 'stroke-primary';
								}
							})()}
							{@const priceNum = safeParseFloat(coin.currentPrice)}
							{@const isVerySmallPrice = priceNum > 0 && priceNum < 0.0001}
							{@const pricePrecision = isVerySmallPrice ? 8 : priceNum < 1 ? 4 : 2}

							<Table.Row
								class="hover:cursor-pointer"
								onclick={() => goto(`/currencies/${coin.slug}`)}
							>
								<Table.Cell class="font-medium">{coin.cmcRank}</Table.Cell>
								<Table.Cell>
									{coin.name} <span class="text-muted-foreground">{coin.symbol}</span>
								</Table.Cell>
								<Table.Cell class="font-medium">
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
								</Table.Cell>
								<Table.Cell
									class={parseFloat(coin.percentChange1h) >= 0 ? 'text-green-600' : 'text-red-600'}
								>
									{formatPercentage(coin.percentChange1h)}
								</Table.Cell>
								<Table.Cell
									class={parseFloat(coin.percentChange24h) >= 0 ? 'text-green-600' : 'text-red-600'}
								>
									{formatPercentage(coin.percentChange24h)}
								</Table.Cell>
								<Table.Cell
									class={parseFloat(coin.percentChange7d) >= 0 ? 'text-green-600' : 'text-red-600'}
								>
									{formatPercentage(coin.percentChange7d)}
								</Table.Cell>
								<Table.Cell>{formatLargeCurrency(coin.marketCap)}</Table.Cell>
								<Table.Cell>{formatLargeCurrency(coin.volume24h)}</Table.Cell>
								<Table.Cell
									>{formatSupply(coin.circulatingSupply)}
									<span class="ml-1 text-muted-foreground">{coin.symbol}</span></Table.Cell
								>
								<Table.Cell class="py-5">
									{#if chartData.length > 1}
										<div class="h-10 w-full">
											<Chart
												data={chartData}
												x="date"
												xScale={scaleTime()}
												y="value"
												yDomain={[null, null]}
												padding={{ top: 2, bottom: 2, left: 1, right: 1 }}
											>
												<Svg>
													<Spline 
														class="{chartColorClass} animate-draw-line stroke-2"
														style="transform: translateZ(0); will-change: transform;"
													/>
												</Svg>
											</Chart>
										</div>
									{:else}
										<div
											class="flex h-10 w-full items-center justify-center text-xs text-muted-foreground"
										>
											--
										</div>
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	{:else if error}
		<p class="m-4 text-red-600">{error}</p>
		<Button onclick={fetchCoins}>Try Again</Button>
	{:else}
		<p class="m-4">Loading cryptocurrency data...</p>
	{/if}
</div>

<style>
	:global(.animate-draw-line) {
		stroke-dasharray: 1000;
		stroke-dashoffset: 1000;
		animation: drawLine 1.1s ease-in-out forwards;
		transform: translateZ(0);
		will-change: stroke-dashoffset;
	}

	@keyframes drawLine {
		to {
			stroke-dashoffset: 0;
		}
	}
</style>
