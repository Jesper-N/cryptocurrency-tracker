import ky from "ky";
import { lt, sql } from "drizzle-orm";
import { db } from "$lib/server/db";
import { coins, priceHistory } from "$lib/server/db/schema";
import type { CMCApiResponse } from "$lib/types";
import { days, size } from "$lib/server/coins";
import { privateEnv } from "$lib/server/env";

const API_URL =
  "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest";
const FETCH_INTERVAL = 70000;

function text(value: number | null) {
  if (value === null) {
    return null;
  }

  return String(value);
}

function shape(data: CMCApiResponse) {
  const now = new Date();
  const rows = data.data.map((item) => ({
    id: String(item.id),
    name: item.name,
    symbol: item.symbol,
    slug: item.slug,
    dateAdded: new Date(item.date_added),
    maxSupply: text(item.max_supply),
    circulatingSupply: text(item.circulating_supply),
    cmcRank: item.cmc_rank,
    currentPrice: String(item.quote.USD.price),
    volume24h: String(item.quote.USD.volume_24h),
    volumeChange24h: text(item.quote.USD.volume_change_24h),
    marketCap: String(item.quote.USD.market_cap),
    percentChange1h: text(item.quote.USD.percent_change_1h),
    percentChange24h: text(item.quote.USD.percent_change_24h),
    percentChange7d: text(item.quote.USD.percent_change_7d),
    percentChange30d: text(item.quote.USD.percent_change_30d),
    percentChange60d: text(item.quote.USD.percent_change_60d),
    percentChange90d: text(item.quote.USD.percent_change_90d),
    lastUpdated: now,
  }));
  const ticks = rows.map((row) => ({
    coinId: row.id,
    price: row.currentPrice,
    timestamp: now,
  }));

  return { rows, ticks, now };
}

function set() {
  return {
    name: sql`excluded.name`,
    symbol: sql`excluded.symbol`,
    slug: sql`excluded.slug`,
    dateAdded: sql`excluded.date_added`,
    maxSupply: sql`excluded.max_supply`,
    circulatingSupply: sql`excluded.circulating_supply`,
    cmcRank: sql`excluded.cmc_rank`,
    currentPrice: sql`excluded.current_price`,
    volume24h: sql`excluded.volume_24h`,
    volumeChange24h: sql`excluded.volume_change_24h`,
    marketCap: sql`excluded.market_cap`,
    percentChange1h: sql`excluded.percent_change_1h`,
    percentChange24h: sql`excluded.percent_change_24h`,
    percentChange7d: sql`excluded.percent_change_7d`,
    percentChange30d: sql`excluded.percent_change_30d`,
    percentChange60d: sql`excluded.percent_change_60d`,
    percentChange90d: sql`excluded.percent_change_90d`,
    lastUpdated: sql`excluded.last_updated`,
  };
}

async function pull() {
  return ky
    .get(API_URL, {
      searchParams: {
        start: "1",
        limit: String(size),
        convert: "USD",
      },
      headers: {
        "X-CMC_PRO_API_KEY": privateEnv.CMC_API_KEY,
        Accept: "application/json",
      },
      timeout: 10000,
    })
    .json<CMCApiResponse>();
}

async function cycle() {
  const data = await pull();
  const next = shape(data);
  const cut = new Date(next.now.getTime() - days * 24 * 60 * 60 * 1000);
  const root = db();

  await root.transaction(async (tx) => {
    await tx.insert(coins).values(next.rows).onConflictDoUpdate({
      target: coins.id,
      set: set(),
    });
    await tx.insert(priceHistory).values(next.ticks);
    await tx.delete(priceHistory).where(lt(priceHistory.timestamp, cut));
  });

  console.log(
    `Updated ${String(next.rows.length)} cryptocurrencies at ${next.now.toISOString()}`,
  );
}

function start() {
  void cycle().catch((err: unknown) => {
    console.error("CMC update cycle failed:", err);
  });
}

export function initCMCPollingService(): { stop: () => void } {
  console.log("Starting CMC polling service...");
  start();

  const id = setInterval(() => {
    start();
  }, FETCH_INTERVAL);

  return {
    stop: () => {
      clearInterval(id);
      console.log("CMC polling service stopped");
    },
  };
}
