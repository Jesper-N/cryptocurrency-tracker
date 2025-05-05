<script lang="ts">
	import type { PriceHistoryPoint } from '$lib/types';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import NumberFlow, { continuous } from '@number-flow/svelte';
	import { scaleTime } from 'd3-scale';
	import {
		Area,
		Axis,
		Chart,
		Highlight,
		LinearGradient,
		RectClipPath,
		Svg,
		Tooltip
	} from 'layerchart';
	import { format, PeriodType } from '@layerstack/utils';
	const { data: initialData } = $props();

	let coin = $state(initialData?.coin);
	let history = $state(initialData?.history || []);
	let error = $state<string | null>(null);

	let chartData = $derived(
		history.map((point: PriceHistoryPoint) => ({
			date: new Date(point.timestamp),
			value: parseFloat(point.price)
		}))
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
	<div class="flex size-full flex-grow">
		<!-- Side information panel -->
		<div class="w-1/3 border-r border-muted">
			<div class="flex flex-col gap-y-1 p-4">
				<!-- Name, symbol and mc rank -->
				<div class="flex items-baseline gap-x-2">
					<h1 class="text-4xl">
						{coin.name}
					</h1>
					<h2 class="text-lg text-muted-foreground">{coin.symbol}</h2>
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
					<div class="rounded-lg border bg-card p-2 text-center shadow-sm">
						<div class="text-xs text-muted-foreground">Market Cap</div>
						<div class="text-lg font-semibold">
							{formatSupply(coin.marketCap)}
						</div>
					</div>

					<!-- Volume (24h) -->
					<div class="rounded-lg border bg-card p-2 text-center shadow-sm">
						<div class="text-xs text-muted-foreground">Volume (24h)</div>
						<div class="text-lg font-semibold">
							{formatSupply(coin.volume24h)}
						</div>
					</div>

					<!-- Total supply -->
					<div class="rounded-lg border bg-card p-2 text-center shadow-sm">
						<div class="text-xs text-muted-foreground">Total supply</div>
						<div class="text-lg font-semibold">
							{formatSupply(coin.circulatingSupply)}
							{coin.symbol}
						</div>
					</div>

					<!-- Max supply -->
					<div class="rounded-lg border bg-card p-2 text-center shadow-sm">
						<div class="text-xs text-muted-foreground">Max. supply</div>
						<div class="text-lg font-semibold">
							{formatSupply(coin.maxSupply)}
							{coin.symbol}
						</div>
					</div>

					<!-- Date added -->
					<div class="rounded-lg border bg-card p-2 text-center shadow-sm">
						<div class="text-xs text-muted-foreground">Date added</div>
						<div class="text-lg font-semibold">
							{new Date(coin.dateAdded).toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'short'
							})}
						</div>
					</div>

					<!-- % change 90d -->
					<div class="rounded-lg border bg-card p-2 text-center shadow-sm">
						<div class="text-xs text-muted-foreground">Percent change (90d)</div>
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
		<div class="flex size-full flex-grow p-4">
			<div class="w-full">
				<div class="h-[200px] rounded border border-muted md:h-[350px] lg:h-[550px]">
					<Chart
						data={chartData}
						x="date"
						xScale={scaleTime()}
						y="value"
						yDomain={[null, null]}
						yNice
						padding={{ top: 48, bottom: 24 }}
						tooltip={{ mode: 'bisect-x' }}
						let:width
						let:height
						let:padding
						let:tooltip
					>
						<Svg>
							<LinearGradient class="from-primary/50 to-primary/0" vertical let:gradient>
								<Area line={{ class: 'stroke-2 stroke-primary opacity-20' }} fill={gradient} />
								<RectClipPath x={0} y={0} width={tooltip.data ? tooltip.x : width} {height} spring>
									<Area line={{ class: 'stroke-2 stroke-primary' }} fill={gradient} />
								</RectClipPath>
							</LinearGradient>
							<Highlight points lines={{ class: 'stroke-primary [stroke-dasharray:unset]' }} />
							<Axis placement="bottom" />
						</Svg>

						<Tooltip.Root
							y={48}
							xOffset={4}
							variant="none"
							class="text-sm font-semibold leading-3 text-primary"
							let:data
						>
							{#if data.value < 0.001}
								${data.value.toFixed(8)}
							{:else if data.value < 1}
								${data.value.toFixed(4)}
							{:else}
								{format(data.value, 'currency')}
							{/if}
						</Tooltip.Root>

						<Tooltip.Root
							x={4}
							y={4}
							variant="none"
							class="text-sm font-semibold leading-3"
							let:data
						>
							{format(data.date, PeriodType.DayTime)}
						</Tooltip.Root>

						<Tooltip.Root
							x="data"
							y={height + padding.top + 2}
							anchor="top"
							variant="none"
							class="text-primary-content whitespace-nowrap rounded bg-primary px-2 py-1 text-sm font-semibold leading-3"
							let:data
						>
							{format(data.date, PeriodType.DayTime)}
						</Tooltip.Root>
					</Chart>
				</div>
			</div>
		</div>
	</div>
{/if}
