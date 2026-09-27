"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";
import { saveProduct, deleteProduct, seedSamples, dbConfigured, type ProductInput } from "@/lib/store";

/* A single password, kept in the server's settings, never in the code.
 * The cookie is signed, so it cannot be forged, and expires after a week. */

const COOKIE = "mj-admin";
const WEEK = 60 * 60 * 24 * 7;

/* Guessing is made slow and then stopped. Held in memory, so it resets when the
 * server restarts: enough to defeat automated guessing, and paired with a long
 * password that is what matters. */
const attempts = new Map<string, { count: number; until: number }>();
const LOCK_AFTER = 6;
const LOCK_FOR = 15 * 60 * 1000;

async function clientKey() {
  const h = await headers();
  return (h.get("x-forwarded-for") || "unknown").split(",")[0].trim();
}

const secret = () => process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "";

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}
function same(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function isSignedIn() {
  if (!process.env.ADMIN_PASSWORD) return false;
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return false;
  const [issued, mac] = raw.split(".");
  if (!issued || !mac) return false;
  if (Number(issued) + WEEK * 1000 < Date.now()) return false;
  try { return same(mac, sign(issued)); } catch { return false; }
}

export async function signIn(_prev: unknown, form: FormData) {
  const password = String(form.get("password") || "");
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) return { error: "No password is set on the server yet. Add ADMIN_PASSWORD in Vercel." };

  const who = await clientKey();
  const record = attempts.get(who);
  if (record && record.until > Date.now()) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }
  if (password.length < 1 || !same(password, expected)) {
    const count = (record?.count || 0) + 1;
    attempts.set(who, { count, until: count >= LOCK_AFTER ? Date.now() + LOCK_FOR : 0 });
    await new Promise((r) => setTimeout(r, 400 + count * 200));   /* slow every guess down */
    return { error: count >= LOCK_AFTER ? "Too many attempts. Try again in a few minutes." : "That password is not right." };
  }
  attempts.delete(who);
  const issued = String(Date.now());
  const jar = await cookies();
  jar.set(COOKIE, `${issued}.${sign(issued)}`, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: WEEK,
  });
  redirect("/admin");
}

export async function signOut() {
  const jar = await cookies();
  jar.delete(COOKIE);
  redirect("/admin/login");
}

/** Everything a product page shows, taken from the form. */
function readForm(form: FormData): ProductInput {
  const lines = (key: string) =>
    String(form.get(key) || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const specs = lines("specs").map((l) => {
    const [k, ...rest] = l.split(":");
    return [k.trim(), rest.join(":").trim()] as [string, string];
  }).filter(([k, v]) => k && v);
  const name = String(form.get("name") || "").trim();
  const slug = (String(form.get("slug") || "") || name)
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  const num = (key: string) => {
    const v = String(form.get(key) || "").replace(/[^\d]/g, "");
    return v ? Number(v) : 0;
  };
  return {
    slug, name,
    category: String(form.get("category") || "Solar") as ProductInput["category"],
    short: String(form.get("short") || "").trim(),
    description: String(form.get("description") || "").trim(),
    price: num("price"),
    was: num("was") || undefined,
    bonus: String(form.get("bonus") || "").trim() || undefined,
    freeDelivery: form.get("freeDelivery") === "on",
    inStock: form.get("inStock") === "on",
    includes: lines("includes"),
    specs,
    image: String(form.get("image") || "").trim() || "/stock/solar-roof.webp",
  };
}

/** Tells Bing and Yandex the moment a product changes. */
async function announce(paths: string[]) {
  const key = process.env.INDEXNOW_KEY;
  const host = "mojatechelectrical.com";
  if (!key) return;
  try {
    await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`,
        urlList: paths.map((p) => `https://${host}${p}`) }),
    });
  } catch { /* announcing is a bonus; never block a save */ }
}

export async function upsertProduct(_prev: unknown, form: FormData) {
  if (!(await isSignedIn())) return { error: "Please sign in again." };
  if (!dbConfigured()) return { error: "No database is connected yet. Add DATABASE_URL in Vercel." };
  const p = readForm(form);
  if (!p.name) return { error: "A product needs a name." };
  if (!p.price) return { error: "A product needs a price." };
  try {
    await saveProduct(p);
    revalidatePath("/products");
    revalidatePath(`/products/${p.slug}`);
    revalidatePath("/sitemap.xml");
    await announce(["/products", `/products/${p.slug}`]);
    return { ok: `Saved. ${p.name} is live at /products/${p.slug}` };
  } catch (e) {
    console.error("admin save failed", e);
    return { error: "Could not save. Please try again, or check the database connection." };
  }
}

export async function removeProduct(_prev: unknown, form: FormData) {
  if (!(await isSignedIn())) return { error: "Please sign in again." };
  const slug = String(form.get("slug") || "");
  try {
    await deleteProduct(slug);
    revalidatePath("/products");
    revalidatePath(`/products/${slug}`);
    return { ok: "Removed." };
  } catch (e) {
    console.error("admin delete failed", e);
    return { error: "Could not remove. Please try again." };
  }
}

export async function loadSamples() {
  if (!(await isSignedIn())) return { error: "Please sign in again." };
  if (!dbConfigured()) return { error: "No database is connected yet." };
  try {
    await seedSamples();
    revalidatePath("/products");
    return { ok: "The six samples are now in your database, ready to edit." };
  } catch (e) {
    console.error("admin seed failed", e);
    return { error: "Could not load them. Check the database connection." };
  }
}
