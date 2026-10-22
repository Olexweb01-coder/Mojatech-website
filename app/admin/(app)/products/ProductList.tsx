"use client";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Toast, { nextToast, type ToastMsg } from "@/components/admin/Toast";
import { useSortable, moveItem } from "@/components/admin/useSortable";
import { saveOrder, toggleVisible } from "./actions";

export type Item = {
  slug: string; name: string; category: string; price: number; was?: number;
  image: string; visible: boolean; inStock: boolean;
};

const naira = (n: number) => "₦" + n.toLocaleString("en-NG");

export default function ProductList({ initial, categories, connected, flash }:
  { initial: Item[]; categories: readonly string[]; connected: boolean; flash?: string }) {
  const [items, setItems] = useState(initial);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [toast, setToast] = useState<ToastMsg>(flash ? { text: flash, at: 1 } : null);
  const [, start] = useTransition();
  const say = (text: string, tone?: "good" | "bad") => setToast({ text, tone, at: nextToast() });

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((p) => (cat === "All" || p.category === cat) && (!q || p.name.toLowerCase().includes(q)));
  }, [items, query, cat]);
  const canSort = connected && !query.trim() && cat === "All" && items.length > 1;
  const hiddenCount = items.filter((p) => !p.visible).length;

  /* ---- Show / hide ---- */
  const flip = (slug: string, visible: boolean) => {
    if (!connected) return say("Connect the database to make changes.", "bad");
    setItems((all) => all.map((p) => (p.slug === slug ? { ...p, visible } : p)));
    start(async () => {
      const r = await toggleVisible(slug, visible);
      if (r?.error) {
        setItems((all) => all.map((p) => (p.slug === slug ? { ...p, visible: !visible } : p)));
        say(r.error, "bad");
      } else if (r?.ok) say(r.ok);
    });
  };

  /* ---- Drag to reorder (shared with Work) ---- */
  const { list, handle } = useSortable(canSort, (from, to) => {
    const before = items;
    const next = moveItem(items, from, to);
    setItems(next);
    start(async () => {
      const r = await saveOrder(next.map((p) => p.slug));
      if (r?.error) { setItems(before); say(r.error, "bad"); } else say("Order saved. The website shows them in this order.");
    });
  });

  return (
    <>
      <div className="mja-head">
        <p className="mja-muted">
          {items.length} {items.length === 1 ? "product" : "products"}
          {hiddenCount > 0 && `, ${hiddenCount} hidden`}
        </p>
        <Link href="/admin/products/new" className="mja-btn red sm">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
          New product
        </Link>
      </div>

      {!connected && (
        <p className="mja-warn">
          No database is connected, so these are the website&apos;s sample products and changes cannot be saved.
          Add <b>DATABASE_URL</b> to <b>.env.local</b> (and in Vercel), then restart.
        </p>
      )}

      <div className="mja-filters">
        <label className="mja-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          <input type="search" placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search products" enterKeyHint="search" />
        </label>
        <div className="mja-chips" role="group" aria-label="Filter by category">
          {["All", ...categories].map((c) => (
            <button key={c} type="button" className="mja-chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
      </div>

      {canSort && <p className="mja-note mja-sort-hint">Drag the handle on the left to change the order on the website.</p>}

      {shown.length === 0 ? (
        <div className="mja-empty">
          {items.length === 0 ? (
            <>
              <h2 className="mja-h3">No products yet</h2>
              <p className="mja-muted">Add the first one and it appears on the website straight away.</p>
              <Link href="/admin/products/new" className="mja-btn red">Add a product</Link>
            </>
          ) : (
            <>
              <h2 className="mja-h3">Nothing matches</h2>
              <p className="mja-muted">Try another word, or choose All.</p>
            </>
          )}
        </div>
      ) : (
        <ul ref={list} className="mja-products">
          {shown.map((p, i) => (
            <li key={p.slug} className={p.visible ? "" : "is-hidden"}>
              {canSort && (
                <button type="button" className="mja-handle" aria-label={`Move ${p.name}. Use the up and down arrow keys.`} {...handle(i, items.length)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                </button>
              )}
              <Link href={`/admin/products/${p.slug}`} className="mja-prow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt="" loading="lazy" decoding="async" />
                <span className="mja-prow-text">
                  <b>{p.name}</b>
                  <span>
                    {naira(p.price)}
                    {p.was ? <s>{naira(p.was)}</s> : null}
                  </span>
                  <span className="mja-tags">
                    <em>{p.category}</em>
                    {!p.visible && <em className="t-hidden">Hidden</em>}
                    {!p.inStock && <em className="t-out">Out of stock</em>}
                  </span>
                </span>
              </Link>
              <label className="mja-switch" title={p.visible ? "Showing on the website" : "Hidden from the website"}>
                <input type="checkbox" role="switch" checked={p.visible} onChange={(e) => flip(p.slug, e.target.checked)}
                  aria-label={`Show ${p.name} on the website`} />
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
