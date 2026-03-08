import type { PriceHistoryPoint } from "$lib/coin-types";

export type Plot = {
  date: Date;
  value: number;
};

const cash = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const day = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});
const map = new Map<number, Intl.NumberFormat>();

function get(precision: number) {
  const fmt = map.get(precision);

  if (fmt) {
    return fmt;
  }

  const next = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });

  map.set(precision, next);

  return next;
}

export function num(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  const next = Number(value);

  if (Number.isNaN(next)) {
    return 0;
  }

  return next;
}

export function digits(value: number) {
  if (value > 0 && value < 0.0001) {
    return 8;
  }

  if (value < 1) {
    return 4;
  }

  return 2;
}

export function price(value: number, precision: number) {
  return `$${get(precision).format(value)}`;
}

export function pct(value: number | string | null | undefined) {
  return `${num(value).toFixed(2)}%`;
}

export function compact(value: number | string | null | undefined) {
  const next = num(value);

  if (next >= 1e12) {
    return `${(next / 1e12).toFixed(2)} T`;
  }

  if (next >= 1e9) {
    return `${(next / 1e9).toFixed(2)} B`;
  }

  if (next >= 1e6) {
    return `${(next / 1e6).toFixed(2)} M`;
  }

  return cash.format(next);
}

export function money(value: number | string | null | undefined) {
  return `$${cash.format(num(value))}`;
}

export function plot(history: PriceHistoryPoint[]) {
  if (history.length < 2) {
    return [];
  }

  return history.map((item) => ({
    date: new Date(item.timestamp),
    value: num(item.price),
  }));
}

export function stroke(points: Plot[]) {
  if (points.length < 2) {
    return "stroke-foreground";
  }

  const first = points[0].value;
  const last = points[points.length - 1].value;

  if (last > first) {
    return "stroke-chart-2";
  }

  if (last < first) {
    return "stroke-chart-3";
  }

  return "stroke-foreground";
}

export function tone(value: number | string | null | undefined) {
  return num(value) >= 0 ? "text-chart-2" : "text-chart-3";
}

export function stamp(value: Date | string) {
  return day.format(new Date(value)).toUpperCase();
}
