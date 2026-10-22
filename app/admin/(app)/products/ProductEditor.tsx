"use client";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Toast, { nextToast, type ToastMsg } from "@/components/admin/Toast";
import PhotoPicker from "@/components/admin/PhotoPicker";
import { saveProduct, removeProduct, duplicateProduct, type Result } from "./actions";

export type Editable = {
  slug: string; name: string; category: string; short: string; description: string;
  price: number; was?: number; bonus?: string; freeDelivery?: boolean; inStock: boolean; visible?: boolean;
  includes: string[]; specs: [string, string][]; photos: string[];
};


const MAX_PHOTOS = 8;
const grouped = (v: number | undefined) => (v ? v.toLocaleString("en-NG") : "");

function Money({ name, label, value, required, hint }: { name: string; label: string; value?: number; required?: boolean; hint?: string }) {
  const [v, setV] = useState(grouped(value));
  return (
    <div className="mja-field">
      <label htmlFor={name}>{label}</label>
      <div className="mja-money">
        <span aria-hidden="true">₦</span>
        <input id={name} name={name} inputMode="numeric" autoComplete="off" required={required} value={v}
          onChange={(e) => { const d = e.target.value.replace(/[^\d]/g, "").slice(0, 12); setV(d ? Number(d).toLocaleString("en-NG") : ""); }} />
      </div>
      {hint && <small className="mja-note">{hint}</small>}
    </div>
  );
}

function Toggle({ name, label, hint, defaultChecked }: { name: string; label: string; hint: string; defaultChecked?: boolean }) {
  return (
    <label className="mja-toggle">
      <span><b>{label}</b><small>{hint}</small></span>
      <span className="mja-switch">
        <input type="checkbox" role="switch" name={name} defaultChecked={defaultChecked} />
        <span aria-hidden="true" />
      </span>
    </label>
  );
}

export default function ProductEditor({ product, categories, stock, connected, flash }:
  { product?: Editable; categories: readonly string[]; stock: [string, string][]; connected: boolean; flash?: string }) {
  const isNew = !product;
  const [state, action, saving] = useActionState<Result, FormData>(saveProduct, null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<ToastMsg>(flash ? { text: flash, at: 1 } : null);
  const [dirty, setDirty] = useState(false);
  const confirmDelete = useRef<HTMLDialogElement>(null);

  const say = (text: string, tone?: "good" | "bad") => setToast({ text, tone, at: nextToast() });

  /* Results from the server become a toast, and a successful save clears "unsaved". */
  const [lastAt, setLastAt] = useState<number | undefined>(undefined);
  if (state?.at && state.at !== lastAt) {
    setLastAt(state.at);
    setToast({ text: state.ok || state.error || "", tone: state.error ? "bad" : "good", at: state.at });
    if (state.ok) setDirty(false);
  }

  /* Warn before leaving the page with unsaved changes. */
  useEffect(() => {
    if (!dirty || saving) return;
    const stop = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", stop);
    return () => window.removeEventListener("beforeunload", stop);
  }, [dirty, saving]);

  return (
    <>
      <Link href="/admin/products" className="mja-back">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        All products
      </Link>
      <h2 className="mja-h2 mja-edit-title">{isNew ? "New product" : product.name}</h2>
      {!isNew && (
        <p className="mja-note mja-address">
          On the website at <a href={`/products/${product.slug}`} target="_blank" rel="noreferrer">/products/{product.slug}</a>
          {product.visible === false && " (hidden right now)"}
        </p>
      )}

      {!connected && <p className="mja-warn">No database is connected, so this can be viewed but not saved.</p>}

      {/* Submitted by hand (not <form action>) so a failed save never clears what was typed. */}
      <form className="mja-editor" onInput={() => setDirty(true)}
        onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.currentTarget); startTransition(() => action(data)); }}>
        {!isNew && <input type="hidden" name="slug" value={product.slug} />}

        <PhotoPicker initial={product?.photos || []} max={MAX_PHOTOS} stock={stock} connected={connected} say={say}
          onChange={({ uploading: u }) => { setUploading(u); setDirty(true); }} />

        <section className="mja-card">
          <h3 className="mja-h3">Basics</h3>
          <div className="mja-field">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" required defaultValue={product?.name} placeholder="e.g. 3.5kVA hybrid inverter" maxLength={120} />
          </div>
          <div className="mja-field">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" defaultValue={product?.category || categories[0]}>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="mja-field">
            <label htmlFor="short">One line for listings</label>
            <input id="short" name="short" defaultValue={product?.short} maxLength={180} placeholder="Runs a full home and charges from solar or the grid." />
          </div>
        </section>

        <section className="mja-card">
          <h3 className="mja-h3">Price</h3>
          <div className="mja-two">
            <Money name="price" label="Price" value={product?.price} required />
            <Money name="was" label="Old price (optional)" value={product?.was} hint="Shown struck through, with the saving." />
          </div>
          <div className="mja-field">
            <label htmlFor="bonus">Bonus line (optional)</label>
            <input id="bonus" name="bonus" defaultValue={product?.bonus} maxLength={140} placeholder="Installation included within Lagos and Ogun" />
          </div>
          <Toggle name="freeDelivery" label="Free delivery" hint="Shows a free delivery badge." defaultChecked={product?.freeDelivery} />
        </section>

        <section className="mja-card">
          <h3 className="mja-h3">Details</h3>
          <div className="mja-field">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" rows={5} defaultValue={product?.description}
              placeholder="What it suits, what it powers, and what MOJATECH does with it." />
          </div>
          <div className="mja-field">
            <label htmlFor="includes">What the price covers</label>
            <textarea id="includes" name="includes" rows={4} defaultValue={product?.includes.join("\n")}
              placeholder={"One per line, e.g.\n3.5kVA inverter\nInstallation and wiring"} />
          </div>
          <div className="mja-field">
            <label htmlFor="specs">Specifications</label>
            <textarea id="specs" name="specs" rows={4} defaultValue={product?.specs.map(([k, v]) => `${k}: ${v}`).join("\n")}
              placeholder={"One per line as Name: value, e.g.\nCapacity: 3.5kVA / 24V"} />
          </div>
        </section>

        <section className="mja-card">
          <h3 className="mja-h3">On the website</h3>
          <Toggle name="visible" label="Show on the website" hint="Turn off to hide it without deleting it." defaultChecked={product ? product.visible !== false : true} />
          <Toggle name="inStock" label="In stock" hint="Off shows “Available to order”." defaultChecked={product ? product.inStock : true} />
        </section>

        <div className="mja-savebar">
          <span className="mja-note">{uploading ? "Uploading photos…" : dirty ? "Unsaved changes" : isNew ? "" : "All changes saved"}</span>
          <button className="mja-btn red" type="submit" disabled={saving || uploading || !connected}>
            {saving ? "Saving…" : isNew ? "Add product" : "Save changes"}
          </button>
        </div>
      </form>

      {!isNew && connected && (
        <section className="mja-card mja-danger">
          <h3 className="mja-h3">More</h3>
          <div className="mja-more">
            <form action={duplicateProduct}>
              <input type="hidden" name="slug" value={product.slug} />
              <button type="submit" className="mja-btn line sm">Duplicate</button>
            </form>
            <button type="button" className="mja-btn line sm danger" onClick={() => confirmDelete.current?.showModal()}>Delete</button>
          </div>
          <p className="mja-note">Duplicate makes a hidden copy to edit, handy for a similar product.</p>
        </section>
      )}

      {!isNew && (
        <dialog ref={confirmDelete} className="mja-dialog small" aria-labelledby="del-title">
          <h3 id="del-title" className="mja-h3">Delete {product.name}?</h3>
          <p className="mja-muted">It comes off the website and its uploaded photos are removed. This cannot be undone. To take it down for a while, hide it instead.</p>
          <form action={removeProduct} className="mja-dialog-actions">
            <input type="hidden" name="slug" value={product.slug} />
            <button type="button" className="mja-btn line" onClick={() => confirmDelete.current?.close()}>Keep it</button>
            <button type="submit" className="mja-btn red">Delete</button>
          </form>
        </dialog>
      )}

      <Toast msg={toast} />
    </>
  );
}
