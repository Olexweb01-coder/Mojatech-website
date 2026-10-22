import { createHash } from "crypto";
import { sql, dbConfigured } from "@/lib/store";

/* Everything the website sends in: quote requests, product orders and job
 * applications. Saved here first, then the visitor carries on to WhatsApp as
 * before, so nothing is lost even if the WhatsApp message is never sent. */

export type Kind = "quote" | "order" | "careers";

export const KINDS: Record<Kind, { label: string; plural: string }> = {
  quote: { label: "Quote request", plural: "Quotes" },
  order: { label: "Order", plural: "Orders" },
  careers: { label: "Application", plural: "Careers" },
};

/* Where an enquiry is in its life. Quotes and orders follow a sale; applications
   follow a hiring decision. */
export const STATUSES: Record<Kind, [string, string][]> = {
  quote: [["new", "New"], ["contacted", "Contacted"], ["quoted", "Quoted"], ["won", "Won"], ["lost", "Lost"]],
  order: [["new", "New"], ["contacted", "Contacted"], ["paid", "Paid"], ["delivered", "Delivered"], ["cancelled", "Cancelled"]],
  careers: [["new", "New"], ["contacted", "Contacted"], ["accepted", "Accepted"], ["declined", "Declined"]],
};
export const CLOSED = new Set(["won", "lost", "delivered", "cancelled", "accepted", "declined"]);

export const statusLabel = (kind: Kind, status: string) =>
  STATUSES[kind]?.find(([v]) => v === status)?.[1] ?? status;

export type Note = { at: string; text: string };
export type Enquiry = {
  id: string; kind: Kind; status: string; name: string; phone: string; email: string;
  summary: string; fields: [string, string][]; notes: Note[]; page: string;
  seen: boolean; createdAt: string; updatedAt: string;
};

type Row = {
  id: string; kind: Kind; status: string; name: string; phone: string; email: string; summary: string;
  fields: [string, string][]; notes: Note[]; page: string; seen_at: Date | null; created_at: Date; updated_at: Date;
};

const toEnquiry = (r: Row): Enquiry => ({
  id: String(r.id), kind: r.kind, status: r.status, name: r.name, phone: r.phone, email: r.email,
  summary: r.summary, fields: r.fields || [], notes: r.notes || [], page: r.page,
  seen: Boolean(r.seen_at), createdAt: r.created_at.toISOString(), updatedAt: r.updated_at.toISOString(),
});

export const hashIp = (ip: string) =>
  createHash("sha256").update(ip + (process.env.ADMIN_SECRET || "mj")).digest("hex").slice(0, 32);

/** How many this visitor has sent in the last 10 minutes (to stop floods). */
export async function recentFrom(ipHash: string) {
  const rows = await sql<{ n: string }>(
    "SELECT count(*)::text AS n FROM enquiries WHERE ip_hash = $1 AND created_at > now() - interval '10 minutes'", [ipHash]);
  return Number(rows[0]?.n || 0);
}

export async function addEnquiry(e: { kind: Kind; name: string; phone: string; email: string; summary: string; fields: [string, string][]; page: string; ipHash: string }) {
  const rows = await sql<{ id: string }>(
    `INSERT INTO enquiries (kind, name, phone, email, summary, fields, page, ip_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [e.kind, e.name, e.phone, e.email, e.summary, JSON.stringify(e.fields), e.page, e.ipHash]);
  return String(rows[0].id);
}

export async function listEnquiries(limit = 300): Promise<Enquiry[]> {
  if (!dbConfigured()) return [];
  const rows = await sql<Row>("SELECT * FROM enquiries ORDER BY created_at DESC LIMIT $1", [limit]);
  return rows.map(toEnquiry);
}

export async function getEnquiry(id: string): Promise<Enquiry | undefined> {
  if (!dbConfigured() || !/^\d{1,18}$/.test(id)) return undefined;
  const rows = await sql<Row>("SELECT * FROM enquiries WHERE id = $1", [id]);
  return rows[0] ? toEnquiry(rows[0]) : undefined;
}

export async function unseenCount() {
  if (!dbConfigured()) return 0;
  const rows = await sql<{ n: string }>("SELECT count(*)::text AS n FROM enquiries WHERE seen_at IS NULL");
  return Number(rows[0]?.n || 0);
}

export async function markSeen(id: string) {
  await sql("UPDATE enquiries SET seen_at = now() WHERE id = $1 AND seen_at IS NULL", [id]);
}

export async function markUnseen(id: string) {
  await sql("UPDATE enquiries SET seen_at = NULL WHERE id = $1", [id]);
}

export async function setStatus(id: string, status: string) {
  await sql("UPDATE enquiries SET status = $2, updated_at = now() WHERE id = $1", [id, status]);
}

export async function addNote(id: string, text: string) {
  const note: Note = { at: new Date().toISOString(), text };
  await sql("UPDATE enquiries SET notes = notes || $2::jsonb, updated_at = now() WHERE id = $1", [id, JSON.stringify([note])]);
}

export async function removeEnquiry(id: string) {
  await sql("DELETE FROM enquiries WHERE id = $1", [id]);
}

/** A Nigerian number as WhatsApp wants it: 0816… becomes 234816… */
export function waNumber(phone: string) {
  const d = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (/^0\d{10}$/.test(d)) return "234" + d.slice(1);
  if (/^[1-9]\d{9}$/.test(d)) return "234" + d;
  return d;
}
