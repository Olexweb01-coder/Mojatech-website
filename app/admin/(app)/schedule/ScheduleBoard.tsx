"use client";
import { startTransition, useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Toast, { nextToast, type ToastMsg } from "@/components/admin/Toast";
import { saveItem, toggleDone, removeItem, type Result } from "./actions";

type Item = {
  id: string; title: string; kind: string; startsAt: string; local: string; location: string; notes: string;
  assignee: string; who: string; remindBefore: number; repeat: string; alarm: boolean; done: boolean; enquiryId: string | null;
};

const TZ = "Africa/Lagos";
const dayKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));
const time = (iso: string) => new Intl.DateTimeFormat("en-NG", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso));
const dayLabel = (key: string, today: string, tomorrow: string) =>
  key === today ? "Today" : key === tomorrow ? "Tomorrow"
    : new Intl.DateTimeFormat("en-NG", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(key + "T12:00:00Z"));

/** Now, as "2026-10-22T14:05" in Lagos time, for the date picker. */
const lagosNow = (addMinutes = 0) => new Date(Date.now() + 3600_000 + addMinutes * 60_000).toISOString().slice(0, 16);

export default function ScheduleBoard({ me, items: initial, people, kinds, repeats, reminds, prefill }: {
  me: string; items: Item[]; people: { value: string; label: string }[];
  kinds: [string, string][]; repeats: [string, string][]; reminds: [number, string][];
  prefill?: { title: string; enquiryId: string };
}) {
  const [items, setItems] = useState(initial);
  const [prev, setPrev] = useState(initial);
  if (initial !== prev) { setPrev(initial); setItems(initial); }
  const [editing, setEditing] = useState<Item | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [toast, setToast] = useState<ToastMsg>(null);
  const [, start] = useTransition();
  const dialog = useRef<HTMLDialogElement>(null);
  const say = (text: string, tone?: "good" | "bad") => setToast({ text, tone, at: nextToast() });

  const [state, action, saving] = useActionState<Result, FormData>(saveItem, null);
  const [lastAt, setLastAt] = useState<number | undefined>(undefined);
  if (state?.at && state.at !== lastAt) { setLastAt(state.at); setToast({ text: state.ok || state.error || "", tone: state.error ? "bad" : "good", at: state.at }); }
  useEffect(() => { if (state?.ok) dialog.current?.close(); }, [state]);

  const [nowKey, setNowKey] = useState({ today: "", tomorrow: "", now: 0 });
  useEffect(() => {
    const t = () => setNowKey({ today: dayKey(new Date().toISOString()), tomorrow: dayKey(new Date(Date.now() + 86400_000).toISOString()), now: Date.now() });
    t();
    const id = window.setInterval(t, 60_000);
    return () => window.clearInterval(id);
  }, []);

  /* Coming from an enquiry ("Schedule a follow-up"): open the form ready to fill. */
  const opened = useRef(false);
  useEffect(() => {
    if (prefill && !opened.current) { opened.current = true; setEditing(null); setFormKey((k) => k + 1); dialog.current?.showModal(); }
  }, [prefill]);

  const groups = useMemo(() => {
    const open = items.filter((i) => !i.done);
    const overdue = open.filter((i) => nowKey.now && new Date(i.startsAt).getTime() < nowKey.now - 30 * 60_000);
    const upcoming = open.filter((i) => !overdue.includes(i));
    const byDay = new Map<string, Item[]>();
    for (const i of upcoming) { const k = dayKey(i.startsAt); byDay.set(k, [...(byDay.get(k) || []), i]); }
    return { overdue, days: [...byDay.entries()], done: items.filter((i) => i.done) };
  }, [items, nowKey.now]);

  const openNew = () => { setEditing(null); setFormKey((k) => k + 1); dialog.current?.showModal(); };
  const openEdit = (i: Item) => { setEditing(i); setFormKey((k) => k + 1); dialog.current?.showModal(); };

  const done = (i: Item, v: boolean) => {
    setItems((all) => all.map((x) => (x.id === i.id ? { ...x, done: v } : x)));
    start(async () => { const r = await toggleDone(i.id, v); if (r?.error) { setItems((all) => all.map((x) => (x.id === i.id ? i : x))); say(r.error, "bad"); } });
  };
  const del = (i: Item) => {
    dialog.current?.close();
    setItems((all) => all.filter((x) => x.id !== i.id));
    start(async () => { const r = await removeItem(i.id); if (r?.error) { setItems((all) => [...all, i]); say(r.error, "bad"); } else say("Deleted."); });
  };

  const row = (i: Item) => (
    <li key={i.id} className={"mjs-item" + (i.done ? " is-done" : "") + (i.alarm ? " is-alarm" : "")}>
      <label className="mjs-check">
        <input type="checkbox" checked={i.done} onChange={(e) => done(i, e.target.checked)} aria-label={`Done: ${i.title}`} />
        <span aria-hidden="true" />
      </label>
      <button type="button" className="mjs-body" onClick={() => openEdit(i)}>
        <span className="mjs-time">{time(i.startsAt)}</span>
        <span className="mjs-main">
          <b>{i.title}</b>
          <span className="mja-tags">
            <em>{kinds.find(([k]) => k === i.kind)?.[1] || "Reminder"}</em>
            {i.assignee !== me && <em>{i.who}</em>}
            {i.repeat !== "none" && <em>{repeats.find(([k]) => k === i.repeat)?.[1]}</em>}
            {i.alarm && <em className="t-out">Alarm</em>}
          </span>
          {i.location && <span className="mjs-loc">{i.location}</span>}
        </span>
      </button>
    </li>
  );

  const it = editing;
  return (
    <>
      <div className="mja-head">
        <p className="mja-muted">{items.filter((i) => !i.done).length} coming up</p>
        <button type="button" className="mja-btn red sm" onClick={openNew}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
          Add
        </button>
      </div>
      <p className="mja-note mjs-tip">Tip: you can also tell Arik, for example “remind me to call Tunde tomorrow at 10am” or “schedule a site visit in Lekki on Friday at 2pm for everyone”.</p>

      {items.length === 0 ? (
        <div className="mja-empty">
          <h2 className="mja-h3">Nothing scheduled</h2>
          <p className="mja-muted">Add reminders, site visits, installations, deliveries and follow-ups. Everyone they are for gets an alert at the time you choose.</p>
          <button type="button" className="mja-btn red" onClick={openNew}>Add the first one</button>
        </div>
      ) : (
        <div className="mjs-days">
          {groups.overdue.length > 0 && (
            <section><h2 className="mjs-day overdue">Overdue</h2><ul className="mjs-list">{groups.overdue.map(row)}</ul></section>
          )}
          {groups.days.map(([k, list]) => (
            <section key={k}><h2 className="mjs-day">{dayLabel(k, nowKey.today, nowKey.tomorrow)}</h2><ul className="mjs-list">{list.map(row)}</ul></section>
          ))}
          {groups.done.length > 0 && (
            <details className="mjs-done"><summary>Done recently ({groups.done.length})</summary><ul className="mjs-list">{groups.done.map(row)}</ul></details>
          )}
        </div>
      )}

      <dialog ref={dialog} className="mja-dialog" aria-labelledby="sch-title">
        <div className="mja-dialog-head">
          <h3 id="sch-title" className="mja-h3">{it ? "Edit" : "Add to the schedule"}</h3>
          <button type="button" className="mja-menu" onClick={() => dialog.current?.close()} aria-label="Close">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <form key={formKey} className="mja-dialog-form" onSubmit={(e) => { e.preventDefault(); const d = new FormData(e.currentTarget); startTransition(() => action(d)); }}>
          {it && <input type="hidden" name="id" value={it.id} />}
          <input type="hidden" name="enquiryId" value={it?.enquiryId || prefill?.enquiryId || ""} />
          <div className="mja-chips mjs-kinds" role="radiogroup" aria-label="Type">
            {kinds.map(([k, label], n) => (
              <label key={k} className="mjs-kind"><input type="radio" name="kind" value={k} defaultChecked={it ? it.kind === k : n === (prefill?.enquiryId ? 3 : 0)} /><span>{label}</span></label>
            ))}
          </div>
          <div className="mja-field"><label htmlFor="sch-t">What</label>
            <input id="sch-t" name="title" required maxLength={140} defaultValue={it?.title || prefill?.title || ""} placeholder="e.g. Call Tunde about the 5kVA quote" /></div>
          <div className="mja-two">
            <div className="mja-field"><label htmlFor="sch-w">When</label>
              <input id="sch-w" name="when" type="datetime-local" required defaultValue={it?.local || lagosNow(60).slice(0, 14) + "00"} /></div>
            <div className="mja-field"><label htmlFor="sch-r">Alert</label>
              <select id="sch-r" name="remind" defaultValue={String(it?.remindBefore ?? 15)}>{reminds.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          </div>
          <div className="mja-two">
            <div className="mja-field"><label htmlFor="sch-a">For</label>
              <select id="sch-a" name="assignee" defaultValue={it?.assignee || me}>{people.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
            <div className="mja-field"><label htmlFor="sch-rep">Repeat</label>
              <select id="sch-rep" name="repeat" defaultValue={it?.repeat || "none"}>{repeats.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          </div>
          <div className="mja-field"><label htmlFor="sch-l">Where (optional)</label>
            <input id="sch-l" name="location" maxLength={160} defaultValue={it?.location} placeholder="e.g. 12 Admiralty Way, Lekki" /></div>
          <div className="mja-field"><label htmlFor="sch-n">Notes (optional)</label>
            <textarea id="sch-n" name="notes" rows={3} maxLength={1000} defaultValue={it?.notes} placeholder="Tools to bring, who to ask for, what was agreed" /></div>
          <label className="mja-toggle">
            <span><b>Alarm</b><small>Stays on the screen until dismissed, with a long vibration. For things that must not be missed.</small></span>
            <span className="mja-switch"><input type="checkbox" role="switch" name="alarm" defaultChecked={it?.alarm} /><span aria-hidden="true" /></span>
          </label>
          <div className="mja-dialog-actions">
            {it && <button type="button" className="mja-btn line danger mjs-del" onClick={() => del(it)}>Delete</button>}
            <button type="button" className="mja-btn line" onClick={() => dialog.current?.close()}>Cancel</button>
            <button type="submit" className="mja-btn red" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </dialog>
      <Toast msg={toast} />
    </>
  );
}
