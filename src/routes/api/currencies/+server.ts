import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { listCoins } from "$lib/server/coins";

export const GET: RequestHandler = async () => {
  return json({
    coins: await listCoins(),
  });
};
