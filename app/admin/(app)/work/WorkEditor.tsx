"use client";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Toast, { nextToast, type ToastMsg } from "@/components/admin/Toast";
import PhotoPicker from "@/components/admin/PhotoPicker";
import { saveProject, removeProject, type Result } from "./actions";

export type Editable = { slug: string; title: string; type: string; location: string; story: string; alt: string; photos: string[]; visible: boolean };

export default function WorkEditor({ project, stock, connected, flash }:
  { project?: Editable; stock: [string, string][]; connected: boolean; flash?: string }) {
  const isNew = !project;
  const [state, action, saving] = useActionState<Result, FormData>(saveProject, null);
  const [toast, setToast] = useState<ToastMsg>(flash ? { text: flash, at: 1 } : null);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const confirmDelete = useRef<HTMLDialogElement>(null);
  const say = (text: string, tone?: "good" | "bad") => setToast({ text, tone, at: nextToast() });

  const [lastAt, setLastAt] = useState<number | undefined>(undefined);
  if (state?.at && state.at !== lastAt) {
    setLastAt(state.at);
    setToast({ text: state.ok || state.error || "", tone: state.error ? "bad" : "good", at: state.at });
    if (state.ok) setDirty(false);
  }

  useEffect(() => {
    if (!dirty || saving) return;
    const stop = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", stop);
    return () => window.removeEventListener("beforeunload", stop);
  }, [dirty, saving]);

  return (
    <>
      <Link href="/admin/work" className="mja-back">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        All projects
      </Link>
      <h2 className="mja-h2 mja-edit-title">{isNew ? "New project" : project.title}</h2>
      {!isNew && (
        <p className="mja-note mja-address">
          On the website at <a href={`/work/${project.slug}`} target="_blank" rel="noreferrer">/work/{project.slug}</a>
          {!project.visible && " (hidden right now)"}
        </p>
      )}
      {!connected && <p className="mja-warn">No database is connected, so this can be viewed but not saved.</p>}

      <form className="mja-editor" onInput={() => setDirty(true)}
        onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.currentTarget); startTransition(() => action(data)); }}>
        {!isNew && <input type="hidden" name="slug" value={project.slug} />}

        <PhotoPicker initial={project?.photos || []} max={12} stock={stock} connected={connected} say={say}
          hint="The first is the cover photo." onChange={({ uploading: u }) => { setUploading(u); setDirty(true); }} />

        <section className="mja-card">
          <h3 className="mja-h3">About the job</h3>
          <div className="mja-field">
            <label htmlFor="title">Project name</label>
            <input id="title" name="title" required maxLength={120} defaultValue={project?.title} placeholder="e.g. Flour Mills NG, or Lekki duplex" />
          </div>
          <div className="mja-two">
            <div className="mja-field">
              <label htmlFor="type">Type of work</label>
              <input id="type" name="type" maxLength={120} defaultValue={project?.type} placeholder="e.g. Solar installation" list="work-types" />
              <datalist id="work-types">
                {["Solar installation", "Inverter installation", "Full electrical installation", "Full-house electrical works", "CCTV installation", "Industrial electrical project", "Maintenance"].map((t) => <option key={t} value={t} />)}
              </datalist>
            </div>
            <div className="mja-field">
              <label htmlFor="location">Location (optional)</label>
              <input id="location" name="location" maxLength={120} defaultValue={project?.location} placeholder="e.g. Ikorodu, Lagos" />
            </div>
          </div>
          <div className="mja-field">
            <label htmlFor="story">The story (optional)</label>
            <textarea id="story" name="story" rows={5} defaultValue={project?.story}
              placeholder="What the client needed, what MOJATECH installed, and the result. A few lines is plenty." />
            <small className="mja-note">With a story or more than one photo, the project gets its own page on the website.</small>
          </div>
          <div className="mja-field">
            <label htmlFor="alt">Photo description (optional)</label>
            <input id="alt" name="alt" maxLength={200} defaultValue={project?.alt} placeholder="e.g. MOJATECH technicians fitting solar panels on a rooftop" />
            <small className="mja-note">Read aloud to blind visitors and used by Google. Leave empty to use the name and type.</small>
          </div>
        </section>

        <section className="mja-card">
          <h3 className="mja-h3">On the website</h3>
          <label className="mja-toggle">
            <span><b>Show on the website</b><small>Turn off to hide it without deleting it.</small></span>
            <span className="mja-switch"><input type="checkbox" role="switch" name="visible" defaultChecked={project ? project.visible : true} /><span aria-hidden="true" /></span>
          </label>
        </section>

        <div className="mja-savebar">
          <span className="mja-note">{uploading ? "Uploading photos…" : dirty ? "Unsaved changes" : isNew ? "" : "All changes saved"}</span>
          <button className="mja-btn red" type="submit" disabled={saving || uploading || !connected}>{saving ? "Saving…" : isNew ? "Add project" : "Save changes"}</button>
        </div>
      </form>

      {!isNew && connected && (
        <section className="mja-card mja-danger">
          <h3 className="mja-h3">More</h3>
          <div className="mja-more">
            <button type="button" className="mja-btn line sm danger" onClick={() => confirmDelete.current?.showModal()}>Delete project</button>
          </div>
        </section>
      )}
      {!isNew && (
        <dialog ref={confirmDelete} className="mja-dialog small" aria-labelledby="del-title">
          <h3 id="del-title" className="mja-h3">Delete {project.title}?</h3>
          <p className="mja-muted">It comes off the website and its uploaded photos are removed. This cannot be undone. To take it down for a while, hide it instead.</p>
          <form action={removeProject} className="mja-dialog-actions">
            <input type="hidden" name="slug" value={project.slug} />
            <button type="button" className="mja-btn line" onClick={() => confirmDelete.current?.close()}>Keep it</button>
            <button type="submit" className="mja-btn red">Delete</button>
          </form>
        </dialog>
      )}
      <Toast msg={toast} />
    </>
  );
}
