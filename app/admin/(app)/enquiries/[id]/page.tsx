import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { KINDS, STATUSES, getEnquiry, waNumber } from "@/lib/enquiries";
import { fullDate, when } from "@/lib/time";
import EnquiryTools from "./EnquiryTools";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const e = await getEnquiry((await params).id).catch(() => undefined);
  return { title: e?.name || "Enquiry" };
}

export default async function EnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("enquiries");
  const e = await getEnquiry((await params).id);
  if (!e) notFound();

  const first = e.name.split(" ")[0];
  const reply = encodeURIComponent(
    e.kind === "careers" ? `Hello ${first}, this is MOJATECH about your application.` :
    `Hello ${first}, this is MOJATECH about your ${e.kind === "order" ? "order" : "quote request"}${e.summary ? ` (${e.summary})` : ""}.`);

  return (
    <>
      <Link href="/admin/enquiries" className="mja-back">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        All enquiries
      </Link>
      <h2 className="mja-h2 mja-edit-title">{e.name || (e.kind === "order" ? "Order from a website visitor" : "No name given")}</h2>
      <p className="mja-note mja-address">{KINDS[e.kind].label} · {fullDate(e.createdAt)} ({when(e.createdAt)}){e.page && <> · from {e.page}</>}</p>

      <div className="mja-detail">
        {(e.phone || e.email) ? (
          <div className="mja-contact">
            {e.phone && <a className="mja-btn red" href={`tel:${e.phone.replace(/[^\d+]/g, "")}`}>Call {e.phone}</a>}
            {e.phone && <a className="mja-btn line" href={`https://wa.me/${waNumber(e.phone)}?text=${reply}`} target="_blank" rel="noreferrer">WhatsApp</a>}
            {e.email && <a className="mja-btn line" href={`mailto:${e.email}?subject=${encodeURIComponent("MOJATECH")}`}>Email</a>}
            <Link className="mja-btn line" href={`/admin/schedule?enquiry=${e.id}&title=${encodeURIComponent(`Follow up with ${e.name || "the customer"}${e.summary ? ` (${e.summary})` : ""}`)}`}>Schedule a follow-up</Link>
          </div>
        ) : e.kind === "order" ? (
          <p className="mja-warn">This visitor tapped “Order on WhatsApp”, so their message should be in MOJATECH&apos;s WhatsApp around {fullDate(e.createdAt)}. Their number will be there.</p>
        ) : null}

        <section className="mja-card">
          <h3 className="mja-h3">Details</h3>
          <dl className="mja-dl">
            {([["Name", e.name], ["Phone", e.phone], ["Email", e.email], ...e.fields] as [string, string][])
              .filter(([, v]) => v)
              .map(([k, v]) => <div key={k} className="mja-dl-row"><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
        </section>

        <EnquiryTools id={e.id} seen={e.seen} status={e.status} statuses={STATUSES[e.kind]}
          notes={e.notes.map((n) => ({ ...n, label: fullDate(n.at) }))} />
      </div>
    </>
  );
}
