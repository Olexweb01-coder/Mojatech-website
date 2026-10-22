"use client";
import { startTransition, useActionState, useEffect, useRef, useState, useTransition } from "react";
import Toast, { nextToast, type ToastMsg } from "@/components/admin/Toast";
import { saveReview, changeReview, removeReview, type Result } from "./actions";

export type Item = {
  id: string; name: string; place: string; rating: number; text: string; service: string;
  status: "pending" | "published" | "hidden"; source: "admin" | "website"; when: string;
};

const TABS: [Item["status"], string][] = [["pending", "Waiting"], ["published", "On the website"], ["hidden", "Hidden"]];

function Stars({ n }: { n: number }) {
  return <span className="mja-stars" aria-label={`${n} out of 5 stars`}>{"★★★★★".slice(0, n)}<i>{"★★★★★".slice(n)}</i></span>;
}

export default function ReviewsManager({ initial, connected, reviewLink }: { initial: Item[]; connected: boolean; reviewLink: string }) {
  const [items, setItems] = useState(initial);
  const pendingCount = items.filter((r) => r.status === "pending").length;
  const [tab, setTab] = useState<Item["status"]>(pendingCount ? "pending" : "published");
  const [toast, setToast] = useState<ToastMsg>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [rating, setRating] = useState(5);
  const [, start] = useTransition();
  const dialog = useRef<HTMLDialogElement>(null);
  const confirmDel = useRef<HTMLDialogElement>(null);
  const [deleting, setDeleting] = useState<Item | null>(null);
  const say = (text: string, tone?: "good" | "bad") => setToast({ text, tone, at: nextToast() });

  const [state, action, saving] = useActionState<Result, FormData>(saveReview, null);
  const [lastAt, setLastAt] = useState<number | undefined>(undefined);
  if (state?.at && state.at !== lastAt) {
    setLastAt(state.at);
    setToast({ text: state.ok || state.error || "", tone: state.error ? "bad" : "good", at: state.at });
  }
  /* A successful save closes the form. */
  useEffect(() => { if (state?.ok) dialog.current?.close(); }, [state]);

  /* When the server sends fresh data (after a save), show it. */
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) { setPrevInitial(initial); setItems(initial); }

  const open = (r: Item | null) => { setEditing(r); setRating(r?.rating ?? 5); dialog.current?.showModal(); };

  const move = (r: Item, status: Item["status"]) => {
    setItems((all) => all.map((x) => (x.id === r.id ? { ...x, status } : x)));
    start(async () => {
      const res = await changeReview(r.id, status);
      if (res?.error) { setItems((all) => all.map((x) => (x.id === r.id ? r : x))); say(res.error, "bad"); } else say(res?.ok || "Saved.");
    });
  };

  const del = () => {
    const r = deleting;
    if (!r) return;
    confirmDel.current?.close();
    setItems((all) => all.filter((x) => x.id !== r.id));
    start(async () => {
      const res = await removeReview(r.id);
      if (res?.error) { setItems((all) => [r, ...all]); say(res.error, "bad"); } else say("Deleted.");
    });
  };

  const share = async () => {
    const msg = `Thank you for choosing MOJATECH. If you have a minute, please tell others about the work we did for you: ${reviewLink}`;
    try {
      if (navigator.share) { await navigator.share({ title: "Review MOJATECH", text: msg }); return; }
      await navigator.clipboard.writeText(reviewLink);
      say("Link copied. Paste it into WhatsApp or SMS.");
    } catch { /* closed the share sheet */ }
  };

  const shown = items.filter((r) => r.status === tab);
  return (
    <>
      {!connected && <p className="mja-warn">No database is connected, so reviews cannot be saved yet.</p>}

      <section className="mja-card mja-ask">
        <div>
          <h2 className="mja-h3">Ask a customer for a review</h2>
          <p className="mja-muted">Send them this link after a job. What they write waits here for you to approve.</p>
        </div>
        <div className="mja-more">
          <button type="button" className="mja-btn red sm" onClick={share}>Share the link</button>
          <a className="mja-btn line sm" target="_blank" rel="noreferrer"
            href={`https://wa.me/?text=${encodeURIComponent(`Thank you for choosing MOJATECH. If you have a minute, please tell others about the work we did for you: ${reviewLink}`)}`}>WhatsApp</a>
          <button type="button" className="mja-btn line sm" onClick={() => open(null)} disabled={!connected}>Add one yourself</button>
        </div>
      </section>

      <div className="mja-chips mja-tabs" role="group" aria-label="Show">
        {TABS.map(([k, label]) => {
          const n = items.filter((r) => r.status === k).length;
          return (
            <button key={k} type="button" className="mja-chip" aria-pressed={tab === k} onClick={() => setTab(k)}>
              {label}{n > 0 && (k === "pending" ? <i className="mja-count">{n}</i> : <span className="mja-chip-n">{n}</span>)}
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <div className="mja-empty">
          <h2 className="mja-h3">{tab === "pending" ? "Nothing waiting" : tab === "published" ? "No reviews on the website yet" : "Nothing hidden"}</h2>
          <p className="mja-muted">{tab === "published" ? "Once a review is published, a “What clients say” section appears on the home page and the Work page." : "New reviews from the website land here first."}</p>
        </div>
      ) : (
        <ul className="mja-reviews">
          {shown.map((r) => (
            <li key={r.id} className="mja-card">
              <div className="mja-review-top">
                <Stars n={r.rating} />
                <span className="mja-note">{r.when} · {r.source === "website" ? "From the website" : "Added by you"}</span>
              </div>
              <blockquote>{r.text}</blockquote>
              <p className="mja-review-who"><b>{r.name}</b>{[r.place, r.service].filter(Boolean).map((x) => ` · ${x}`)}</p>
              <div className="mja-more">
                {r.status !== "published" && <button type="button" className="mja-btn red sm" onClick={() => move(r, "published")}>Publish</button>}
                {r.status === "published" && <button type="button" className="mja-btn line sm" onClick={() => move(r, "hidden")}>Hide</button>}
                {r.status === "pending" && <button type="button" className="mja-btn line sm" onClick={() => move(r, "hidden")}>Don&apos;t publish</button>}
                <button type="button" className="mja-btn line sm" onClick={() => open(r)}>Edit</button>
                <button type="button" className="mja-btn line sm danger" onClick={() => { setDeleting(r); confirmDel.current?.showModal(); }}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <dialog ref={dialog} className="mja-dialog" aria-labelledby="rv-title">
        <div className="mja-dialog-head">
          <h3 id="rv-title" className="mja-h3">{editing ? "Edit review" : "Add a review"}</h3>
          <button type="button" className="mja-menu" onClick={() => dialog.current?.close()} aria-label="Close">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <form key={editing?.id || "new"} className="mja-dialog-form"
          onSubmit={(e) => { e.preventDefault(); const d = new FormData(e.currentTarget); startTransition(() => action(d)); }}>
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <input type="hidden" name="rating" value={rating} />
          <div className="mja-field">
            <span className="mja-label">Rating</span>
            <div className="mja-rate" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  className={n <= rating ? "on" : ""} onClick={() => setRating(n)}>★</button>
              ))}
            </div>
          </div>
          <div className="mja-field">
            <label htmlFor="rv-text">What they said</label>
            <textarea id="rv-text" name="text" rows={4} required maxLength={1200} defaultValue={editing?.text} placeholder="Paste or type their words." />
          </div>
          <div className="mja-two">
            <div className="mja-field"><label htmlFor="rv-name">Name</label><input id="rv-name" name="name" required maxLength={80} defaultValue={editing?.name} placeholder="e.g. Mrs. Adeyemi" /></div>
            <div className="mja-field"><label htmlFor="rv-place">Where (optional)</label><input id="rv-place" name="place" maxLength={80} defaultValue={editing?.place} placeholder="e.g. Ikeja, Lagos" /></div>
          </div>
          <div className="mja-field"><label htmlFor="rv-service">Job (optional)</label><input id="rv-service" name="service" maxLength={80} defaultValue={editing?.service} placeholder="e.g. 5kVA solar installation" /></div>
          <label className="mja-toggle">
            <span><b>Show on the website</b><small>Only share reviews customers are happy to have public.</small></span>
            <span className="mja-switch"><input type="checkbox" role="switch" name="publish" defaultChecked={editing ? editing.status === "published" : true} /><span aria-hidden="true" /></span>
          </label>
          <div className="mja-dialog-actions">
            <button type="button" className="mja-btn line" onClick={() => dialog.current?.close()}>Cancel</button>
            <button type="submit" className="mja-btn red" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </dialog>

      <dialog ref={confirmDel} className="mja-dialog small" aria-labelledby="rv-del">
        <h3 id="rv-del" className="mja-h3">Delete this review?</h3>
        <p className="mja-muted">It is removed for good. To keep it but take it off the website, hide it instead.</p>
        <div className="mja-dialog-actions">
          <button type="button" className="mja-btn line" onClick={() => confirmDel.current?.close()}>Keep it</button>
          <button type="button" className="mja-btn red" onClick={del}>Delete</button>
        </div>
      </dialog>
      <Toast msg={toast} />
    </>
  );
}
