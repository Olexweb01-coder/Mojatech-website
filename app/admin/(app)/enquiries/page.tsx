import { requireAdmin } from "@/lib/admin-auth";
import { dbConfigured } from "@/lib/store";
import { KINDS, CLOSED, listEnquiries, statusLabel } from "@/lib/enquiries";
import { when } from "@/lib/time";
import EnquiryList, { type Row } from "./EnquiryList";

export const metadata = { title: "Enquiries" };

export default async function Enquiries({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  await requireAdmin("enquiries");
  const all = await listEnquiries().catch(() => []);
  const { done } = await searchParams;

  const rows: Row[] = all.map((e) => ({
    id: e.id, kind: e.kind, kindLabel: KINDS[e.kind].label,
    title: e.name || (e.kind === "order" ? "Website visitor" : "No name given"),
    summary: e.summary, when: when(e.createdAt), status: e.status, statusLabel: statusLabel(e.kind, e.status),
    closed: CLOSED.has(e.status), seen: e.seen,
    search: [e.name, e.phone, e.email, e.summary, ...e.fields.map(([, v]) => v)].join(" ").toLowerCase(),
  }));

  return <EnquiryList rows={rows} connected={dbConfigured()} flash={done === "deleted" ? "Deleted." : undefined} />;
}
