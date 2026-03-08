# Cryptocurrency Tracker

![Showcase](docs/showcase.gif)

A lightweight, self-hosted cryptocurrency tracker built with SvelteKit. It pulls market data from the CoinMarketCap API and caches it in PostgreSQL to avoid rate limits.

I built this for a UI design class at school. The goal was to recreate the CoinMarketCap user experience, but with my own take on the interface design. It uses Svelte 5 for the frontend and handles routing and API calls on the server.

## Features

- Tracks current prices, market cap, and trading volume
- Individual coin pages with historical price charts
- Clean interface built with Tailwind v4, shadcn-svelte and motion.dev
- PostgreSQL database to cache API responses
- Written entirely in TypeScript

## Setup

You need Node.js and Docker installed on your machine. You will also need a free API key from CoinMarketCap.

1. Install the dependencies:

```bash
npm install
```

2. Start the local database container and push the schema:

```bash
npm run db:start
npm run db:push
```

3. Start the dev server:

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

## Deployment

To deploy to production, build the app first:

```bash
npm run build
```

This generates a Node server in the `build/` directory. You can run it directly:

```bash
node build/index.js
```

I usually run this behind an Nginx reverse proxy using PM2 to keep the Node process alive.
