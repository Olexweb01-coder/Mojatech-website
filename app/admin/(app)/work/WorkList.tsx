"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import Toast, { nextToast, type ToastMsg } from "@/components/admin/Toast";
import { useSortable, moveItem } from "@/components/admin/useSortable";
import { saveProjectOrder, toggleProject } from "./actions";

export type Item = { slug: string; title: string; type: string; img: string; visible: boolean; photos: number };

export default function WorkList({ initial, connected, flash }: { initial: Item[]; connected: boolean; flash?: string }) {
  const [items, setItems] = useState(initial);
  const [toast, setToast] = useState<ToastMsg>(flash ? { text: flash, at: 1 } : null);
  const [, start] = useTransition();
  const say = (text: string, tone?: "good" | "bad") => setToast({ text, tone, at: nextToast() });
  const canSort = connected && items.length > 1;

  const flip = (slug: string, visible: boolean) => {
    if (!connected) return say("Connect the database to make changes.", "bad");
    setItems((all) => all.map((p) => (p.slug === slug ? { ...p, visible } : p)));
    start(async () => {
      const r = await toggleProject(slug, visible);
      if (r?.error) { setItems((all) => all.map((p) => (p.slug === slug ? { ...p, visible: !visible } : p))); say(r.error, "bad"); }
      else if (r?.ok) say(r.ok);
    });
  };

  const { list, handle } = useSortable(canSort, (from, to) => {
    const before = items;
    const next = moveItem(items, from, to);
    setItems(next);
    start(async () => {
      const r = await saveProjectOrder(next.map((p) => p.slug));
      if (r?.error) { setItems(before); say(r.error, "bad"); } else say(r?.ok || "Saved.");
    });
  });

  const hidden = items.filter((p) => !p.visible).length;
  return (
    <>
      <div className="mja-head">
        <p className="mja-muted">{items.length} {items.length === 1 ? "project" : "projects"}{hidden > 0 && `, ${hidden} hidden`}</p>
        <Link href="/admin/work/new" className="mja-btn red sm">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
          New project
        </Link>
      </div>
      {!connected && <p className="mja-warn">No database is connected, so these are the website&apos;s built-in projects and changes cannot be saved.</p>}
      {canSort && <p className="mja-note mja-sort-hint">The first projects show first on the home page. Drag the handle to change the order.</p>}

      {items.length === 0 ? (
        <div className="mja-empty">
          <h2 className="mja-h3">No projects yet</h2>
          <p className="mja-muted">Add a finished job with a few photos and it appears on the website straight away.</p>
          <Link href="/admin/work/new" className="mja-btn red">Add a project</Link>
        </div>
      ) : (
        <ul ref={list} className="mja-products">
          {items.map((p, i) => (
            <li key={p.slug} className={p.visible ? "" : "is-hidden"}>
              {canSort && (
                <button type="button" className="mja-handle" aria-label={`Move ${p.title}. Use the up and down arrow keys.`} {...handle(i, items.length)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                </button>
              )}
              <Link href={`/admin/work/${p.slug}`} className="mja-prow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt="" loading="lazy" decoding="async" />
                <span className="mja-prow-text">
                  <b>{p.title}</b>
                  <span className="mja-muted">{p.type || "No type set"}</span>
                  <span className="mja-tags">
                    <em>{p.photos} {p.photos === 1 ? "photo" : "photos"}</em>
                    {!p.visible && <em className="t-hidden">Hidden</em>}
                  </span>
                </span>
              </Link>
              <label className="mja-switch" title={p.visible ? "Showing on the website" : "Hidden from the website"}>
                <input type="checkbox" role="switch" checked={p.visible} onChange={(e) => flip(p.slug, e.target.checked)} aria-label={`Show ${p.title} on the website`} />
                <span aria-hidden="true" />
              </label>
            </li>
          ))}
        </ul>
      )}
      <Toast msg={toast} />
    </>
  );
}
