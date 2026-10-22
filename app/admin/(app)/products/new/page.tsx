import { requireAdmin } from "@/lib/admin-auth";
import { dbConfigured } from "@/lib/store";
import { categories } from "@/lib/data/products";
import { stockPhotos } from "@/lib/data/stock";
import ProductEditor from "../ProductEditor";

export const metadata = { title: "New product" };

export default async function NewProduct() {
  await requireAdmin("products");
  return <ProductEditor categories={categories} stock={stockPhotos} connected={dbConfigured()} />;
}
