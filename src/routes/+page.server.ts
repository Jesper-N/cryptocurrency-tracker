import { listCoins } from "$lib/server/coins";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ depends }) => {
  depends("data:coins");

  return {
    coins: await listCoins(),
  };
};
