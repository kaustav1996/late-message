import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type DB = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __keepsakeSql?: postgres.Sql; __keepsakeDb?: DB };

function connect(): DB {
  if (!globalForDb.__keepsakeDb) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    globalForDb.__keepsakeSql = postgres(url, { max: Number(process.env.DATABASE_POOL_MAX ?? 5) });
    globalForDb.__keepsakeDb = drizzle(globalForDb.__keepsakeSql, { schema });
  }
  return globalForDb.__keepsakeDb;
}

/** Lazily connected so builds and imports never need a database. */
export const db: DB = new Proxy({} as DB, {
  get(_target, prop) {
    const real = connect();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export async function closeDb() {
  await globalForDb.__keepsakeSql?.end({ timeout: 5 });
  globalForDb.__keepsakeSql = undefined;
  globalForDb.__keepsakeDb = undefined;
}

export { schema };
