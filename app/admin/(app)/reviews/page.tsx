import { requireAdmin } from "@/lib/admin-auth";
import { dbConfigured } from "@/lib/store";
import { listAllReviews } from "@/lib/reviews";
import { when } from "@/lib/time";
import { siteUrl } from "@/lib/seo";
import ReviewsManager, { type Item } from "./ReviewsManager";

export const metadata = { title: "Reviews" };

export default async function Reviews() {
  await requireAdmin("reviews");
  const all = await listAllReviews().catch(() => []);
  const items: Item[] = all.map((r) => ({ ...r, when: when(r.createdAt) }));
  return <ReviewsManager initial={items} connected={dbConfigured()} reviewLink={`${siteUrl}/review`} />;
}
