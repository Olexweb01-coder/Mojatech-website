import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { dbConfigured, getAnyProduct } from "@/lib/store";
import { categories } from "@/lib/data/products";
import { stockPhotos } from "@/lib/data/stock";
import ProductEditor from "../ProductEditor";

const FLASH: Record<string, string> = {
  created: "Added. It is on the website now.",
  copied: "Copy made. It is hidden until you switch it on.",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getAnyProduct((await params).slug).catch(() => undefined);
  return { title: p?.name || "Product" };
}

export default async function EditProduct({ params, searchParams }:
  { params: Promise<{ slug: string }>; searchParams: Promise<{ done?: string }> }) {
  await requireAdmin("products");
  const [{ slug }, { done }] = await Promise.all([params, searchParams]);
  const p = await getAnyProduct(slug);
  if (!p) notFound();

  return (
    <ProductEditor key={p.slug} categories={categories} stock={stockPhotos} connected={dbConfigured()}
      flash={done ? FLASH[done] : undefined}
      product={{
        slug: p.slug, name: p.name, category: p.category, short: p.short, description: p.description,
        price: p.price, was: p.was, bonus: p.bonus, freeDelivery: p.freeDelivery, inStock: p.inStock,
        visible: p.visible !== false, includes: p.includes, specs: p.specs,
        photos: p.photos?.length ? p.photos : [p.image],
      }} />
  );
}
