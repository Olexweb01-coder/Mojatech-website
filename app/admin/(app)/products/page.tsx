import { requireAdmin } from "@/lib/admin-auth";
import { listAllProducts, dbConfigured, ensureSeeded } from "@/lib/store";
import { categories } from "@/lib/data/products";
import ProductList, { type Item } from "./ProductList";

export const metadata = { title: "Products" };

export default async function Products({ searchParams }: { searchParams: Promise<{ done?: string; name?: string }> }) {
  await requireAdmin("products");
  const connected = dbConfigured();
  if (connected) await ensureSeeded().catch((e) => console.error("seeding failed", e));
  const all = await listAllProducts().catch(() => []);
  const { done, name } = await searchParams;
  const flash = done === "deleted" ? `Deleted${name ? ` ${name}` : ""}.` : undefined;

  const items: Item[] = all.map((p) => ({
    slug: p.slug, name: p.name, category: p.category, price: p.price, was: p.was,
    image: p.image, visible: p.visible !== false, inStock: p.inStock,
  }));

  return <ProductList initial={items} categories={categories} connected={connected} flash={flash} />;
}
