import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { privateEnv } from "$lib/server/env";

let root: ReturnType<typeof drizzle> | null = null;

export function db() {
  if (root) {
    return root;
  }

  root = drizzle(postgres(privateEnv.DATABASE_URL));

  return root;
}
