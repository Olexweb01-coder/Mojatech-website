import { sql, dbConfigured } from "@/lib/store";

/* What customers say. Reviews sent from the website arrive as "pending" and
 * only appear once approved in the admin. Reviews added in the admin (for
 * example, copied from a WhatsApp message) can be published straight away. */

export type ReviewStatus = "pending" | "published" | "hidden";
export type Review = {
  id: string; name: string; place: string; rating: number; text: string; service: string;
  status: ReviewStatus; source: "admin" | "website"; createdAt: string;
};

type Row = { id: string; name: string; place: string; rating: number; text: string; service: string; status: ReviewStatus; source: "admin" | "website"; created_at: Date };
const toReview = (r: Row): Review => ({ ...r, id: String(r.id), createdAt: r.created_at.toISOString() });

export async function listPublishedReviews(limit = 12): Promise<Review[]> {
  if (!dbConfigured()) return [];
  try {
    return (await sql<Row>("SELECT * FROM reviews WHERE status = 'published' ORDER BY created_at DESC LIMIT $1", [limit])).map(toReview);
  } catch (e) {
    console.error("reviews unavailable", e);
    return [];
  }
}

export async function listAllReviews(): Promise<Review[]> {
  if (!dbConfigured()) return [];
  return (await sql<Row>("SELECT * FROM reviews ORDER BY created_at DESC LIMIT 500")).map(toReview);
}

export async function pendingReviewCount() {
  if (!dbConfigured()) return 0;
  return Number((await sql<{ n: string }>("SELECT count(*)::text AS n FROM reviews WHERE status = 'pending'"))[0]?.n || 0);
}

export async function addReview(r: { name: string; place: string; rating: number; text: string; service: string; status: ReviewStatus; source: "admin" | "website"; ipHash?: string }) {
  await sql(
    `INSERT INTO reviews (name, place, rating, text, service, status, source, ip_hash) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [r.name, r.place, r.rating, r.text, r.service, r.status, r.source, r.ipHash || ""]);
}

export async function updateReview(id: string, r: { name: string; place: string; rating: number; text: string; service: string; status: ReviewStatus }) {
  await sql(
    `UPDATE reviews SET name = $2, place = $3, rating = $4, text = $5, service = $6, status = $7, updated_at = now() WHERE id = $1`,
    [id, r.name, r.place, r.rating, r.text, r.service, r.status]);
}

export async function setReviewStatus(id: string, status: ReviewStatus) {
  await sql("UPDATE reviews SET status = $2, updated_at = now() WHERE id = $1", [id, status]);
}

export async function deleteReview(id: string) {
  await sql("DELETE FROM reviews WHERE id = $1", [id]);
}

export async function recentReviewsFrom(ipHash: string) {
  return Number((await sql<{ n: string }>(
    "SELECT count(*)::text AS n FROM reviews WHERE ip_hash = $1 AND created_at > now() - interval '1 hour'", [ipHash]))[0]?.n || 0);
}
