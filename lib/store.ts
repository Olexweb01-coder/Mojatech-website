import { Pool, type QueryResultRow } from "pg";
import { randomBytes } from "crypto";
import type { Product } from "@/lib/data/products";
import { products as samples } from "@/lib/data/products";

/* The database (Postgres). Optional: without a connection the website shows
 * the sample catalogue and the admin explains what to connect.
 *
 * Tables, all created automatically the first time they are needed:
 *   products  the catalogue
 *   media     photos uploaded from the admin, served at /media/<id>
 *   enquiries quote requests, orders and job applications from the website
 *   projects  the work gallery
 *   reviews   what customers say (sent from the website, or added in the admin)
 *   arik_chats, arik_messages, arik_files, arik_projects   conversations with Arik, shared by the team, with their authors
 *   push_subs, schedule   phones that get alerts, and reminders, jobs and site visits
 *   users, sessions, login_attempts, activity   the team, who is signed in, lockouts, and who did what
 *   kv        small settings, such as "the samples have been imported"
 */

let pool: Pool | null = null;
let ready: Promise<void> | null = null;

/* Vercel has the connection under DATABASE_URL_POOLED; DATABASE_URL also works
   (handy in .env.local). */
const url = () => process.env.DATABASE_URL || process.env.DATABASE_URL_POOLED || "";

export const dbConfigured = () => Boolean(url());

function db() {
  if (!pool) {
    pool = new Pool({
      connectionString: url(),
      /* Verify the database's certificate so the connection cannot be quietly
         intercepted. Local databases have no certificate, so it is skipped there. */
      ssl: /localhost|127\.0\.0\.1/.test(url()) ? false : { rejectUnauthorized: true },
      max: 3,
    });
  }
  return pool;
}

export async function ensureSchema() {
  if (!dbConfigured()) return;
  if (!ready) {
    ready = db()
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
        ALTER TABLE products ADD COLUMN IF NOT EXISTS visible BOOLEAN NOT NULL DEFAULT true;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS photos TEXT[] NOT NULL DEFAULT '{}';
        CREATE TABLE IF NOT EXISTS media (
          id          TEXT PRIMARY KEY,
          mime        TEXT NOT NULL,
          bytes       BYTEA NOT NULL,
          width       INT,
          height      INT,
          size        INT NOT NULL,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS enquiries (
          id          BIGSERIAL PRIMARY KEY,
          kind        TEXT NOT NULL,
          status      TEXT NOT NULL DEFAULT 'new',
          name        TEXT NOT NULL DEFAULT '',
          phone       TEXT NOT NULL DEFAULT '',
          email       TEXT NOT NULL DEFAULT '',
          summary     TEXT NOT NULL DEFAULT '',
          fields      JSONB NOT NULL DEFAULT '[]',
          notes       JSONB NOT NULL DEFAULT '[]',
          page        TEXT NOT NULL DEFAULT '',
          ip_hash     TEXT NOT NULL DEFAULT '',
          seen_at     TIMESTAMPTZ,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS enquiries_created ON enquiries (created_at DESC);
        CREATE INDEX IF NOT EXISTS enquiries_ip ON enquiries (ip_hash, created_at);
        CREATE TABLE IF NOT EXISTS projects (
          slug        TEXT PRIMARY KEY,
          title       TEXT NOT NULL,
          type        TEXT NOT NULL DEFAULT '',
          location    TEXT NOT NULL DEFAULT '',
          story       TEXT NOT NULL DEFAULT '',
          alt         TEXT NOT NULL DEFAULT '',
          photos      TEXT[] NOT NULL DEFAULT '{}',
          visible     BOOLEAN NOT NULL DEFAULT true,
          position    INT NOT NULL DEFAULT 0,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS reviews (
          id          BIGSERIAL PRIMARY KEY,
          name        TEXT NOT NULL,
          place       TEXT NOT NULL DEFAULT '',
          rating      INT NOT NULL DEFAULT 5,
          text        TEXT NOT NULL,
          service     TEXT NOT NULL DEFAULT '',
          status      TEXT NOT NULL DEFAULT 'pending',
          source      TEXT NOT NULL DEFAULT 'admin',
          ip_hash     TEXT NOT NULL DEFAULT '',
          created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS users (
          id            BIGSERIAL PRIMARY KEY,
          name          TEXT NOT NULL,
          email         TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role          TEXT NOT NULL DEFAULT 'manager',
          active        BOOLEAN NOT NULL DEFAULT true,
          must_change   BOOLEAN NOT NULL DEFAULT false,
          last_login_at TIMESTAMPTZ,
          created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS sessions (
          token_hash    TEXT PRIMARY KEY,
          user_id       BIGINT REFERENCES users(id) ON DELETE CASCADE,
          master        BOOLEAN NOT NULL DEFAULT false,
          agent         TEXT NOT NULL DEFAULT '',
          created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
          last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
          expires_at    TIMESTAMPTZ NOT NULL
        );
        CREATE TABLE IF NOT EXISTS login_attempts (
          key           TEXT PRIMARY KEY,
          count         INT NOT NULL DEFAULT 0,
          locked_until  TIMESTAMPTZ,
          updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS activity (
          id            BIGSERIAL PRIMARY KEY,
          actor         TEXT NOT NULL,
          action        TEXT NOT NULL,
          at            TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS activity_at ON activity (at DESC);
        CREATE TABLE IF NOT EXISTS arik_chats (
          id          BIGSERIAL PRIMARY KEY,
          owner       TEXT NOT NULL,
          title       TEXT NOT NULL DEFAULT 'New chat',
          created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS arik_chats_owner ON arik_chats (owner, updated_at DESC);
        CREATE TABLE IF NOT EXISTS arik_projects (
          id          BIGSERIAL PRIMARY KEY,
          name        TEXT NOT NULL,
          pinned      BOOLEAN NOT NULL DEFAULT false,
          created_by  TEXT NOT NULL DEFAULT '',
          created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        ALTER TABLE arik_chats ADD COLUMN IF NOT EXISTS author_name TEXT NOT NULL DEFAULT '';
        ALTER TABLE arik_chats ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false;
        ALTER TABLE arik_chats ADD COLUMN IF NOT EXISTS project_id BIGINT REFERENCES arik_projects(id) ON DELETE SET NULL;
        CREATE TABLE IF NOT EXISTS arik_messages (
          id          BIGSERIAL PRIMARY KEY,
          chat_id     BIGINT NOT NULL REFERENCES arik_chats(id) ON DELETE CASCADE,
          role        TEXT NOT NULL,
          content     TEXT NOT NULL,
          files       JSONB NOT NULL DEFAULT '[]',
          meta        JSONB NOT NULL DEFAULT '{}',
          created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS arik_messages_chat ON arik_messages (chat_id, id);
        CREATE TABLE IF NOT EXISTS arik_files (
          id          TEXT PRIMARY KEY,
          owner       TEXT NOT NULL,
          name        TEXT NOT NULL,
          mime        TEXT NOT NULL,
          kind        TEXT NOT NULL,
          text        TEXT NOT NULL DEFAULT '',
          bytes       BYTEA,
          size        INT NOT NULL,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS push_subs (
          endpoint    TEXT PRIMARY KEY,
          owner       TEXT NOT NULL,
          keys        JSONB NOT NULL,
          agent       TEXT NOT NULL DEFAULT '',
          created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
          last_ok_at  TIMESTAMPTZ
        );
        CREATE TABLE IF NOT EXISTS schedule (
          id              BIGSERIAL PRIMARY KEY,
          title           TEXT NOT NULL,
          kind            TEXT NOT NULL DEFAULT 'reminder',
          starts_at       TIMESTAMPTZ NOT NULL,
          location        TEXT NOT NULL DEFAULT '',
          notes           TEXT NOT NULL DEFAULT '',
          assignee        TEXT NOT NULL DEFAULT 'everyone',
          remind_before   INT NOT NULL DEFAULT 0,
          repeat          TEXT NOT NULL DEFAULT 'none',
          alarm           BOOLEAN NOT NULL DEFAULT false,
          done            BOOLEAN NOT NULL DEFAULT false,
          notified_at     TIMESTAMPTZ,
          enquiry_id      BIGINT,
          created_by      TEXT NOT NULL DEFAULT '',
          created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS schedule_due ON schedule (done, starts_at);
        ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS nudged_at TIMESTAMPTZ;
        CREATE TABLE IF NOT EXISTS kv (
          key         TEXT PRIMARY KEY,
          value       JSONB NOT NULL,
          updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `)
      .then(() => undefined)
      .catch((e) => { ready = null; throw e; });
  }
  return ready;
}

/** Runs a query once the tables exist. For the other data files in lib/. */
export async function sql<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  await ensureSchema();
  return (await db().query<T>(text, values)).rows;
}

/* ---------------- Settings ---------------- */

export async function kvGet<T>(key: string): Promise<T | undefined> {
  await ensureSchema();
  const { rows } = await db().query<{ value: T }>("SELECT value FROM kv WHERE key = $1", [key]);
  return rows[0]?.value;
}

export async function kvSet(key: string, value: unknown) {
  await ensureSchema();
  await db().query(
    `INSERT INTO kv (key, value, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()`,
    [key, JSON.stringify(value)],
  );
}

/* ---------------- Products ---------------- */

type Row = {
  slug: string; name: string; category: string; short: string; description: string;
  price: string; was: string | null; bonus: string | null; free_delivery: boolean;
  in_stock: boolean; includes: string[]; specs: [string, string][]; image: string;
  visible: boolean; photos: string[] | null;
};

const toProduct = (r: Row): Product => {
  const photos = r.photos?.length ? r.photos : r.image ? [r.image] : [];
  return {
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
    image: photos[0] || "/stock/solar-roof.webp",
    photos,
    visible: r.visible,
  };
};

const SEEDED = "products_seeded";

async function allRows(): Promise<Product[]> {
  await ensureSchema();
  const { rows } = await db().query<Row>("SELECT * FROM products ORDER BY position, updated_at DESC");
  return rows.map(toProduct);
}

/** What the website shows: visible products, in the order set in the admin.
 *  Until the admin has been opened once (which imports the samples), an empty
 *  database still shows the samples, so the shop is never blank by accident. */
export async function listProducts(): Promise<Product[]> {
  if (!dbConfigured()) return samples;
  try {
    const all = await allRows();
    if (!all.length && !(await kvGet<boolean>(SEEDED))) return samples;
    return all.filter((p) => p.visible !== false);
  } catch (e) {
    /* Never fall back to the sample catalogue here: its prices are not real. Failing
       instead makes the website keep the last good copy of each page until the
       database is back. */
    console.error("products: database unavailable", e);
    throw e;
  }
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  return (await listProducts()).find((p) => p.slug === slug);
}

/** Everything, hidden ones included. For the admin only. */
export async function listAllProducts(): Promise<Product[]> {
  if (!dbConfigured()) return samples;
  return allRows();
}

export async function getAnyProduct(slug: string): Promise<Product | undefined> {
  if (!dbConfigured()) return samples.find((p) => p.slug === slug);
  await ensureSchema();
  const { rows } = await db().query<Row>("SELECT * FROM products WHERE slug = $1", [slug]);
  return rows[0] ? toProduct(rows[0]) : undefined;
}

/** The first time the admin opens Products on an empty database, the products the
 *  website is showing (the samples) are copied in, so they can be edited at once. */
export async function ensureSeeded() {
  if (!dbConfigured()) return;
  if (await kvGet<boolean>(SEEDED)) return;
  const { rows } = await db().query<{ n: string }>("SELECT count(*)::text AS n FROM products");
  if (Number(rows[0].n) === 0) {
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      await db().query(
        `INSERT INTO products (slug, name, category, short, description, price, was, bonus,
           free_delivery, in_stock, includes, specs, image, photos, position, visible)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,true)
         ON CONFLICT (slug) DO NOTHING`,
        [s.slug, s.name, s.category, s.short, s.description, s.price, s.was ?? null, s.bonus ?? null,
          s.freeDelivery ?? false, s.inStock, s.includes, JSON.stringify(s.specs), s.image, [s.image], i],
      );
    }
  }
  await kvSet(SEEDED, true);
}

export const RESERVED = new Set(["new"]);

export const toSlug = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "product";

/** A web address no other product uses: "solar-panel", then "solar-panel-2", ... */
export async function freeSlug(base: string) {
  await ensureSchema();
  const root = toSlug(base);
  const { rows } = await db().query<{ slug: string }>("SELECT slug FROM products WHERE slug = $1 OR slug LIKE $2", [root, root + "-%"]);
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(root) && !RESERVED.has(root)) return root;
  for (let i = 2; ; i++) if (!taken.has(`${root}-${i}`)) return `${root}-${i}`;
}

export type ProductInput = Omit<Product, "sample" | "image"> & { photos: string[] };

const params = (p: ProductInput) => [
  p.slug, p.name, p.category, p.short, p.description, p.price, p.was ?? null, p.bonus ?? null,
  p.freeDelivery ?? false, p.inStock, p.includes, JSON.stringify(p.specs), p.photos[0] || "", p.photos, p.visible !== false,
];

/** New products go to the top of the list. */
export async function createProduct(p: ProductInput) {
  await ensureSchema();
  await db().query(
    `INSERT INTO products (slug, name, category, short, description, price, was, bonus,
       free_delivery, in_stock, includes, specs, image, photos, visible, position)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
       COALESCE((SELECT min(position) FROM products), 0) - 1)`,
    params(p),
  );
  await kvSet(SEEDED, true);
}

/** Saves changes to an existing product. Returns the photos it no longer uses. */
export async function updateProduct(p: ProductInput): Promise<string[]> {
  await ensureSchema();
  const before = await getAnyProduct(p.slug);
  await db().query(
    `UPDATE products SET name = $2, category = $3, short = $4, description = $5, price = $6, was = $7, bonus = $8,
       free_delivery = $9, in_stock = $10, includes = $11, specs = $12, image = $13, photos = $14, visible = $15, updated_at = now()
     WHERE slug = $1`,
    params(p),
  );
  return (before?.photos || []).filter((x) => !p.photos.includes(x));
}

export async function deleteProduct(slug: string): Promise<string[]> {
  await ensureSchema();
  const { rows } = await db().query<{ photos: string[] }>("DELETE FROM products WHERE slug = $1 RETURNING photos", [slug]);
  await kvSet(SEEDED, true);
  return rows[0]?.photos || [];
}

export async function setVisible(slug: string, visible: boolean) {
  await ensureSchema();
  await db().query("UPDATE products SET visible = $2, updated_at = now() WHERE slug = $1", [slug, visible]);
}

/** Saves a new order, in one statement. */
export async function reorderProducts(slugs: string[]) {
  await ensureSchema();
  await db().query(
    `UPDATE products p SET position = o.i
     FROM unnest($1::text[]) WITH ORDINALITY AS o(slug, i)
     WHERE p.slug = o.slug`,
    [slugs],
  );
}

/* ---------------- Photos ---------------- */

export type MediaRow = { mime: string; bytes: Buffer; size: number };

export async function saveMedia(bytes: Buffer, mime: string, width?: number, height?: number) {
  await ensureSchema();
  const id = randomBytes(12).toString("hex");
  await db().query(
    "INSERT INTO media (id, mime, bytes, width, height, size) VALUES ($1,$2,$3,$4,$5,$6)",
    [id, mime, bytes, width ?? null, height ?? null, bytes.length],
  );
  return `/media/${id}`;
}

export async function getMedia(id: string): Promise<MediaRow | undefined> {
  if (!dbConfigured()) return undefined;
  await ensureSchema();
  const { rows } = await db().query<MediaRow>("SELECT mime, bytes, size FROM media WHERE id = $1", [id]);
  return rows[0];
}

/** Deletes uploaded photos that no product or project uses any more. Stock photos are left alone. */
export async function pruneMedia(urls: string[]) {
  const ids = urls.filter((u) => u.startsWith("/media/")).map((u) => u.slice(7));
  if (!ids.length) return;
  await ensureSchema();
  await db().query(
    `DELETE FROM media m WHERE m.id = ANY($1::text[])
       AND NOT EXISTS (SELECT 1 FROM products p WHERE ('/media/' || m.id) = ANY(p.photos))
       AND NOT EXISTS (SELECT 1 FROM projects j WHERE ('/media/' || m.id) = ANY(j.photos))`,
    [ids],
  );
}
