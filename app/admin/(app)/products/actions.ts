"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { allowed, logActivity } from "@/lib/admin-auth";
import { announce } from "@/lib/indexnow";
import { categories } from "@/lib/data/products";
import {
  dbConfigured, createProduct, updateProduct, deleteProduct, getAnyProduct, setVisible,
  reorderProducts, freeSlug, pruneMedia, type ProductInput,
} from "@/lib/store";

export type Result = { ok?: string; error?: string; at?: number } | null;

const NO_DB = "No database is connected yet. Add DATABASE_URL to .env.local (or in Vercel) and restart.";

/** Refreshes every page that shows products, so a change is live straight away. */
function refresh(slugs: string[] = []) {
  revalidatePath("/products");
  for (const s of slugs) { revalidatePath(`/products/${s}`); revalidatePath(`/admin/products/${s}`); }
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");
  revalidatePath("/admin/products");
}

const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const lines = (f: FormData, k: string) => text(f, k).split("\n").map((l) => l.trim()).filter(Boolean);
const money = (f: FormData, k: string) => {
  const v = text(f, k).replace(/[^\d]/g, "");
  return v ? Number(v) : 0;
};

function read(f: FormData, slug: string): ProductInput | { error: string } {
  const name = text(f, "name");
  if (!name) return { error: "Give the product a name." };
  const price = money(f, "price");
  if (!price) return { error: "Add a price." };
  const was = money(f, "was");
  if (was && was <= price) return { error: "The old price should be higher than the new price, or left empty." };

  let photos: string[] = [];
  try { photos = (JSON.parse(text(f, "photos") || "[]") as unknown[]).filter((x): x is string => typeof x === "string" && x.startsWith("/")).slice(0, 8); } catch {}
  if (!photos.length) return { error: "Add at least one photo." };

  const category = text(f, "category");
  const specs = lines(f, "specs").map((l) => {
    const [k, ...rest] = l.split(":");
    return [k.trim(), rest.join(":").trim()] as [string, string];
  }).filter(([k, v]) => k && v);

  return {
    slug, name,
    category: ((categories as readonly string[]).includes(category) ? category : "Solar") as ProductInput["category"],
    short: text(f, "short"),
    description: text(f, "description"),
    price,
    was: was || undefined,
    bonus: text(f, "bonus") || undefined,
    freeDelivery: f.get("freeDelivery") === "on",
    inStock: f.get("inStock") === "on",
    visible: f.get("visible") === "on",
    includes: lines(f, "includes"),
    specs,
    photos,
  };
}

/** Add a product, or save changes to one. */
export async function saveProduct(_prev: Result, f: FormData): Promise<Result> {
  if (!(await allowed("products"))) return { error: "You are signed out, or your role does not allow this." };
  if (!dbConfigured()) return { error: NO_DB };

  const existing = text(f, "slug");
  const isNew = !existing;
  const slug = isNew ? await freeSlug(text(f, "name")) : existing;
  const p = read(f, slug);
  if ("error" in p) return { error: p.error, at: Date.now() };

  try {
    if (isNew) await createProduct(p);
    else await pruneMedia(await updateProduct(p));
  } catch (e) {
    console.error("save product failed", e);
    return { error: "Could not save. Check the connection and try again.", at: Date.now() };
  }
  refresh([slug]);
  await logActivity(`${isNew ? "Added" : "Updated"} product “${p.name}”`);
  if (p.visible) await announce(["/products", `/products/${slug}`]);
  if (isNew) redirect(`/admin/products/${slug}?done=created`);
  return { ok: p.visible ? "Saved. The website is updated." : "Saved. It stays hidden from the website.", at: Date.now() };
}

export async function removeProduct(f: FormData) {
  if (!(await allowed("products"))) redirect("/admin/login");
  const slug = text(f, "slug");
  const p = await getAnyProduct(slug);
  if (!p || !dbConfigured()) redirect("/admin/products");
  await pruneMedia(await deleteProduct(slug));
  refresh([slug]);
  await logActivity(`Deleted product “${p.name}”`);
  redirect("/admin/products?done=deleted&name=" + encodeURIComponent(p.name));
}

export async function duplicateProduct(f: FormData) {
  if (!(await allowed("products"))) redirect("/admin/login");
  if (!dbConfigured()) redirect("/admin/products");
  const p = await getAnyProduct(text(f, "slug"));
  if (!p) redirect("/admin/products");
  const name = `${p.name} (copy)`;
  const slug = await freeSlug(name);
  await createProduct({ ...p, slug, name, visible: false, photos: p.photos?.length ? p.photos : [p.image] });
  refresh();
  await logActivity(`Duplicated product “${p.name}”`);
  redirect(`/admin/products/${slug}?done=copied`);
}

export async function toggleVisible(slug: string, visible: boolean): Promise<Result> {
  if (!(await allowed("products"))) return { error: "You are signed out, or your role does not allow this." };
  if (!dbConfigured()) return { error: NO_DB };
  try {
    await setVisible(slug, visible);
  } catch {
    return { error: "Could not change that. Try again." };
  }
  refresh([slug]);
  await logActivity(`${visible ? "Showed" : "Hid"} product ${slug}`);
  return { ok: visible ? "Showing on the website." : "Hidden from the website." };
}

export async function saveOrder(slugs: string[]): Promise<Result> {
  if (!(await allowed("products"))) return { error: "You are signed out, or your role does not allow this." };
  if (!dbConfigured()) return { error: NO_DB };
  try {
    await reorderProducts(slugs.slice(0, 500));
  } catch {
    return { error: "Could not save the new order. Try again." };
  }
  refresh();
  await logActivity("Changed the order of products");
  return { ok: "Order saved." };
}
