import { Pool } from "pg";
import type { Product } from "@/lib/data/products";
import { products as samples } from "@/lib/data/products";

/* The database is optional. Without DATABASE_URL the site simply shows the sample
 * catalogue and the admin explains what to connect. With it, the admin writes here
 * and every product page reads from it. */

let pool: Pool | null = null;
let ready: Promise<void> | null = null;

export const dbConfigured = () => Boolean(process.env.DATABASE_URL);

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      /* Verify the database's certificate, so the connection cannot be quietly
         intercepted. Local development has no certificate, so it is skipped there. */
      ssl: /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || "") ? false : { rejectUnauthorized: true },
      max: 3,
    });
  }
  return pool;
}

/** Creates the table the first time it is needed, so there is no migration step. */
export async function ensureSchema() {
  if (!dbConfigured()) return;
  if (!ready) {
    ready = getPool()
      .query(`
        CREATE TABLE IF NOT EXISTS products (
          slug          TEXT PRIMARY KEY,
          name          TEXT NOT NULL,
          category      TEXT NOT NULL,
          short         TEXT NOT NULL DEFAULT '',
          description   TEXT NOT NULL DEFAULT '',
          price         BIGINT NOT NULL DEFAULT 0,
          was           BIGINT,
          bonus         TEXT,
          free_delivery BOOLEAN NOT NULL DEFAULT false,
          in_stock      BOOLEAN NOT NULL DEFAULT true,
          includes      TEXT[] NOT NULL DEFAULT '{}',
          specs         JSONB NOT NULL DEFAULT '[]',
          image         TEXT NOT NULL DEFAULT '',
          position      INT NOT NULL DEFAULT 0,
          updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `)
      .then(() => undefined);
  }
  return ready;
}

type Row = {
  slug: string; name: string; category: string; short: string; description: string;
  price: string; was: string | null; bonus: string | null; free_delivery: boolean;
  in_stock: boolean; includes: string[]; specs: [string, string][]; image: string;
};

const toProduct = (r: Row): Product => ({
  slug: r.slug,
  name: r.name,
  category: r.category as Product["category"],
  short: r.short,
  description: r.description,
  price: Number(r.price),
  was: r.was ? Number(r.was) : undefined,
  bonus: r.bonus || undefined,
  freeDelivery: r.free_delivery,
  inStock: r.in_stock,
  includes: r.includes || [],
  specs: r.specs || [],
  image: r.image,
});

/** Every product, from the database when it is connected, otherwise the samples. */
export async function listProducts(): Promise<Product[]> {
  if (!dbConfigured()) return samples;
  try {
    await ensureSchema();
    const { rows } = await getPool().query<Row>("SELECT * FROM products ORDER BY position, updated_at DESC");
    return rows.length ? rows.map(toProduct) : samples;
  } catch (e) {
    console.error("products: database unavailable, showing samples", e);
    return samples;
  }
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const all = await listProducts();
  return all.find((p) => p.slug === slug);
}

export type ProductInput = Omit<Product, "sample">;

export async function saveProduct(p: ProductInput) {
  await ensureSchema();
  await getPool().query(
    `INSERT INTO products (slug, name, category, short, description, price, was, bonus,
       free_delivery, in_stock, includes, specs, image, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, now())
     ON CONFLICT (slug) DO UPDATE SET
       name = $2, category = $3, short = $4, description = $5, price = $6, was = $7, bonus = $8,
       free_delivery = $9, in_stock = $10, includes = $11, specs = $12, image = $13, updated_at = now()`,
    [p.slug, p.name, p.category, p.short, p.description, p.price, p.was ?? null, p.bonus ?? null,
      p.freeDelivery ?? false, p.inStock, p.includes, JSON.stringify(p.specs), p.image],
  );
}

export async function deleteProduct(slug: string) {
  await ensureSchema();
  await getPool().query("DELETE FROM products WHERE slug = $1", [slug]);
}

/** Copies the six samples into the database, so there is something to edit on day one. */
export async function seedSamples() {
  await ensureSchema();
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    await getPool().query(
      `INSERT INTO products (slug, name, category, short, description, price, was, bonus,
         free_delivery, in_stock, includes, specs, image, position)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (slug) DO NOTHING`,
      [s.slug, s.name, s.category, s.short, s.description, s.price, s.was ?? null, s.bonus ?? null,
        s.freeDelivery ?? false, s.inStock, s.includes, JSON.stringify(s.specs), s.image, i],
    );
  }
}
