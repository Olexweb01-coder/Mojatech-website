"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import Toast, { nextToast, type ToastMsg } from "@/components/admin/Toast";
import { seen as markSeen, changeStatus, note as addNote, unread, remove } from "../actions";

type Note = { at: string; text: string; label: string };

export default function EnquiryTools({ id, seen, status, statuses, notes }:
  { id: string; seen: boolean; status: string; statuses: [string, string][]; notes: Note[] }) {
  const [current, setCurrent] = useState(status);
  const [text, setText] = useState("");
  const [toast, setToast] = useState<ToastMsg>(null);
  const [pending, start] = useTransition();
  const confirm = useRef<HTMLDialogElement>(null);
  const say = (t: string, tone?: "good" | "bad") => setToast({ text: t, tone, at: nextToast() });

  /* Opening an enquiry marks it as read. */
  useEffect(() => { if (!seen) void markSeen(id); }, [id, seen]);

  const pick = (s: string) => {
    if (s === current) return;
    const before = current;
    setCurrent(s);
    start(async () => {
      const r = await changeStatus(id, s);
      if (r?.error) { setCurrent(before); say(r.error, "bad"); } else say(r?.ok || "Saved.");
    });
  };

  const save = () => start(async () => {
    const r = await addNote(id, text);
    if (r?.error) say(r.error, "bad"); else { setText(""); say(r?.ok || "Saved."); }
  });

  return (
    <>
      <section className="mja-card">
        <h3 className="mja-h3">Status</h3>
        <div className="mja-steps" role="radiogroup" aria-label="Status">
          {statuses.map(([v, label]) => (
            <button key={v} type="button" role="radio" aria-checked={current === v} className={`s-${v}`} onClick={() => pick(v)}>{label}</button>
          ))}
        </div>
      </section>

      <section className="mja-card">
        <h3 className="mja-h3">Notes</h3>
        <p className="mja-note">Only the MOJATECH team sees these. Write what was agreed, prices quoted, when to follow up.</p>
        <div className="mja-field">
          <label htmlFor="note" className="mja-sr">New note</label>
          <textarea id="note" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Called. Wants 5kVA with 4 panels, site visit Thursday." />
        </div>
        <button type="button" className="mja-btn red sm mja-self-start" disabled={pending || !text.trim()} onClick={save}>Add note</button>
        {notes.length > 0 && (
          <ol className="mja-notes">
            {[...notes].reverse().map((n) => <li key={n.at}><time>{n.label}</time><p>{n.text}</p></li>)}
          </ol>
        )}
      </section>

      <section className="mja-card">
        <h3 className="mja-h3">More</h3>
        <div className="mja-more">
          <button type="button" className="mja-btn line sm" onClick={() => start(async () => { await unread(id); })}>Mark as unread</button>
          <button type="button" className="mja-btn line sm danger" onClick={() => confirm.current?.showModal()}>Delete</button>
        </div>
      </section>

      <dialog ref={confirm} className="mja-dialog small" aria-labelledby="del-e">
        <h3 id="del-e" className="mja-h3">Delete this enquiry?</h3>
        <p className="mja-muted">It and its notes are removed for good. To keep it but move it out of the way, set its status to a closed one instead.</p>
        <form action={remove} className="mja-dialog-actions">
          <input type="hidden" name="id" value={id} />
          <button type="button" className="mja-btn line" onClick={() => confirm.current?.close()}>Keep it</button>
          <button type="submit" className="mja-btn red">Delete</button>
        </form>
      </dialog>
      <Toast msg={toast} />
    </>
  );
}
