"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import Toast, { type ToastMsg } from "@/components/admin/Toast";

export type Row = {
  id: string; kind: "quote" | "order" | "careers"; kindLabel: string; title: string; summary: string;
  when: string; status: string; statusLabel: string; closed: boolean; seen: boolean; search: string;
};

const TABS: [string, string][] = [["all", "All"], ["quote", "Quotes"], ["order", "Orders"], ["careers", "Careers"]];

export default function EnquiryList({ rows, connected, flash }: { rows: Row[]; connected: boolean; flash?: string }) {
  const [kind, setKind] = useState("all");
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [toast] = useState<ToastMsg>(flash ? { text: flash, at: 1 } : null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => (kind === "all" || r.kind === kind) && (!open || !r.closed) && (!q || r.search.includes(q)));
  }, [rows, kind, open, query]);

  const count = (k: string) => rows.filter((r) => (k === "all" || r.kind === k) && !r.seen).length;

  return (
    <>
      {!connected && (
        <p className="mja-warn">No database is connected, so website enquiries cannot be saved yet. Add <b>DATABASE_URL</b> to <b>.env.local</b>, then restart.</p>
      )}

      <div className="mja-filters">
        <div className="mja-chips" role="group" aria-label="Type">
          {TABS.map(([k, label]) => {
            const n = count(k);
            return (
              <button key={k} type="button" className="mja-chip" aria-pressed={kind === k} onClick={() => setKind(k)}>
                {label}{n > 0 && <i className="mja-count">{n}</i>}
              </button>
            );
          })}
        </div>
        <div className="mja-row-between">
          <label className="mja-search mja-grow">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            <input type="search" placeholder="Search name, phone, details" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search enquiries" enterKeyHint="search" />
          </label>
          <div className="mja-seg" role="group" aria-label="Show">
            <button type="button" aria-pressed={open} onClick={() => setOpen(true)}>Open</button>
            <button type="button" aria-pressed={!open} onClick={() => setOpen(false)}>All</button>
          </div>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="mja-empty">
          {rows.length === 0 ? (
            <>
              <h2 className="mja-h3">No enquiries yet</h2>
              <p className="mja-muted">Quote requests, orders and job applications from the website will appear here the moment they are sent.</p>
            </>
          ) : (
            <>
              <h2 className="mja-h3">Nothing here</h2>
              <p className="mja-muted">{open ? "Everything in this view is closed. Choose All to see them." : "Try another word or type."}</p>
            </>
          )}
        </div>
      ) : (
        <ul className="mja-inbox">
          {shown.map((r) => (
            <li key={r.id} className={r.seen ? "" : "unseen"}>
              <Link href={`/admin/enquiries/${r.id}`}>
                <span className="mja-dot" aria-label={r.seen ? undefined : "New"} />
                <span className="mja-inbox-main">
                  <span className="mja-inbox-top"><b>{r.title}</b><time>{r.when}</time></span>
                  <span className="mja-inbox-sub">{r.kindLabel}{r.summary && ` · ${r.summary}`}</span>
                  <span className={`mja-pill s-${r.status}`}>{r.statusLabel}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Toast msg={toast} />
    </>
  );
}
