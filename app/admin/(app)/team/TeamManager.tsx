"use client";
import { startTransition, useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Toast, { nextToast, type ToastMsg } from "@/components/admin/Toast";
import { createMyAccount, inviteMember, changeRole, toggleActive, resetPassword, deleteMember, type Result } from "./actions";

type RoleKey = "owner" | "manager" | "sales" | "editor";
type Member = { id: string; name: string; email: string; role: RoleKey; active: boolean; mustChange: boolean; seen: string | null };
type Temp = { name: string; email: string; password: string };

export default function TeamManager({ me, connected, loginUrl, roles, members, activity, flash }: {
  me: { id: string | null; master: boolean }; connected: boolean; loginUrl: string;
  roles: { key: RoleKey; label: string; hint: string }[]; members: Member[];
  activity: { actor: string; action: string; when: string }[]; flash?: string;
}) {
  const [toast, setToast] = useState<ToastMsg>(flash ? { text: flash, at: 1 } : null);
  const [temp, setTemp] = useState<Temp | null>(null);
  const [, start] = useTransition();
  const addDialog = useRef<HTMLDialogElement>(null);
  const tempDialog = useRef<HTMLDialogElement>(null);
  const confirmDialog = useRef<HTMLDialogElement>(null);
  const [confirming, setConfirming] = useState<Member | null>(null);
  const say = (text: string, tone?: "good" | "bad") => setToast({ text, tone, at: nextToast() });
  const roleLabel = (k: RoleKey) => roles.find((r) => r.key === k)?.label ?? k;

  const [mine, mineAction, mineBusy] = useActionState<Result, FormData>(createMyAccount, null);
  const [invite, inviteAction, inviteBusy] = useActionState<Result, FormData>(inviteMember, null);
  const [seen, setSeen] = useState<number | undefined>(undefined);
  for (const st of [mine, invite]) {
    if (st?.at && st.at !== seen) {
      setSeen(st.at);
      if (st.error) setToast({ text: st.error, tone: "bad", at: st.at });
      if (st.temp) setTemp(st.temp);
    }
  }
  useEffect(() => { if (invite?.temp) { addDialog.current?.close(); tempDialog.current?.showModal(); } }, [invite]);

  const run = (fn: () => Promise<Result>) => start(async () => {
    const r = await fn();
    if (r?.error) say(r.error, "bad");
    else {
      if (r?.ok) say(r.ok);
      if (r?.temp) { setTemp(r.temp); tempDialog.current?.showModal(); }
    }
  });

  const shareText = temp ? `Hello ${temp.name.split(" ")[0]}, you now have access to MOJATECH Admin.\n\nOpen: ${loginUrl}\nEmail: ${temp.email}\nTemporary password: ${temp.password}\n\nYou will be asked to choose your own password when you sign in.` : "";
  const copy = async () => { try { await navigator.clipboard.writeText(shareText); say("Copied. Send it to them privately."); } catch { say("Could not copy. Select the text and copy it.", "bad"); } };

  if (!connected) return <p className="mja-warn">Team accounts need the database. Add <b>DATABASE_URL</b> to <b>.env.local</b>, then restart.</p>;

  return (
    <>
      {me.master && (
        <section className="mja-card mja-callout">
          <h2 className="mja-h3">First, create your own account</h2>
          <p className="mja-muted">You are signed in with the master password. Make an owner account for yourself, then sign in with your email from now on. Keep the master password safe as a way back in.</p>
          <form className="mja-dialog-form" onSubmit={(e) => { e.preventDefault(); const d = new FormData(e.currentTarget); startTransition(() => mineAction(d)); }}>
            <div className="mja-two">
              <div className="mja-field"><label htmlFor="my-name">Your name</label><input id="my-name" name="name" required maxLength={80} autoComplete="name" /></div>
              <div className="mja-field"><label htmlFor="my-email">Your email</label><input id="my-email" name="email" type="email" required autoComplete="username" /></div>
            </div>
            <div className="mja-two">
              <div className="mja-field"><label htmlFor="my-pw">Password</label><input id="my-pw" name="password" type="password" required minLength={10} autoComplete="new-password" /><small className="mja-note">At least 10 characters.</small></div>
              <div className="mja-field"><label htmlFor="my-pw2">Password again</label><input id="my-pw2" name="password2" type="password" required minLength={10} autoComplete="new-password" /></div>
            </div>
            <button className="mja-btn red mja-self-start" type="submit" disabled={mineBusy}>{mineBusy ? "Creating…" : "Create my account"}</button>
          </form>
        </section>
      )}

      <div className="mja-head">
        <p className="mja-muted">{members.filter((m) => m.active).length} {members.filter((m) => m.active).length === 1 ? "person" : "people"} can sign in</p>
        <button type="button" className="mja-btn red sm" onClick={() => addDialog.current?.showModal()}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
          Add someone
        </button>
      </div>

      {members.length === 0 ? (
        <div className="mja-empty"><h2 className="mja-h3">No accounts yet</h2><p className="mja-muted">Create your own account above first.</p></div>
      ) : (
        <ul className="mja-team">
          {members.map((m) => {
            const self = m.id === me.id;
            return (
              <li key={m.id} className={"mja-card" + (m.active ? "" : " is-off")}>
                <div className="mja-member">
                  <span className="mja-avatar" aria-hidden="true">{m.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</span>
                  <div className="mja-member-text">
                    <b>{m.name}{self && <em className="mja-you">You</em>}</b>
                    <span>{m.email}</span>
                    <span className="mja-tags">
                      <em className={`r-${m.role}`}>{roleLabel(m.role)}</em>
                      {!m.active && <em className="t-out">Switched off</em>}
                      {m.mustChange && m.active && <em className="t-hidden">Has not signed in yet</em>}
                      {m.seen && <em>Active {m.seen.toLowerCase()}</em>}
                    </span>
                  </div>
                </div>
                {self ? (
                  <Link href="/admin/account" className="mja-btn line sm mja-self-start">Your account</Link>
                ) : (
                  <div className="mja-member-tools">
                    <label className="mja-field mja-inline">
                      <span className="mja-sr">Role for {m.name}</span>
                      <select value={m.role} onChange={(e) => run(() => changeRole(m.id, e.target.value as RoleKey))} aria-label={`Role for ${m.name}`}>
                        {roles.map((r) => <option key={r.key} value={r.key}>{r.label}: {r.hint}</option>)}
                      </select>
                    </label>
                    <div className="mja-more">
                      <button type="button" className="mja-btn line sm" onClick={() => run(() => resetPassword(m.id))}>New password</button>
                      <button type="button" className="mja-btn line sm" onClick={() => run(() => toggleActive(m.id, !m.active))}>{m.active ? "Switch off" : "Switch on"}</button>
                      <button type="button" className="mja-btn line sm danger" onClick={() => { setConfirming(m); confirmDialog.current?.showModal(); }}>Remove</button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <section className="mja-card mja-roles">
        <h2 className="mja-h3">What each role can do</h2>
        <dl className="mja-dl">
          {roles.map((r) => <div key={r.key} className="mja-dl-row"><dt>{r.label}</dt><dd>{r.hint}. Everyone can use Arik.</dd></div>)}
        </dl>
      </section>

      {activity.length > 0 && (
        <section className="mja-card">
          <h2 className="mja-h3">Recent activity</h2>
          <ol className="mja-activity">
            {activity.map((a, i) => <li key={i}><b>{a.actor}</b> {a.action.charAt(0).toLowerCase() + a.action.slice(1)}<time>{a.when}</time></li>)}
          </ol>
        </section>
      )}

      <dialog ref={addDialog} className="mja-dialog" aria-labelledby="add-title">
        <div className="mja-dialog-head">
          <h3 id="add-title" className="mja-h3">Add someone</h3>
          <button type="button" className="mja-menu" onClick={() => addDialog.current?.close()} aria-label="Close">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <form className="mja-dialog-form" onSubmit={(e) => { e.preventDefault(); const d = new FormData(e.currentTarget); startTransition(() => inviteAction(d)); }}>
          <div className="mja-two">
            <div className="mja-field"><label htmlFor="in-name">Name</label><input id="in-name" name="name" required maxLength={80} /></div>
            <div className="mja-field"><label htmlFor="in-email">Email</label><input id="in-email" name="email" type="email" required /></div>
          </div>
          <fieldset className="mja-rolepick">
            <legend className="mja-label">Role</legend>
            {roles.map((r, i) => (
              <label key={r.key}>
                <input type="radio" name="role" value={r.key} defaultChecked={i === 1} />
                <span><b>{r.label}</b><small>{r.hint}</small></span>
              </label>
            ))}
          </fieldset>
          <p className="mja-note">You will get a temporary password to send them. They choose their own when they first sign in.</p>
          <div className="mja-dialog-actions">
            <button type="button" className="mja-btn line" onClick={() => addDialog.current?.close()}>Cancel</button>
            <button type="submit" className="mja-btn red" disabled={inviteBusy}>{inviteBusy ? "Adding…" : "Add"}</button>
          </div>
        </form>
      </dialog>

      <dialog ref={tempDialog} className="mja-dialog small" aria-labelledby="temp-title">
        <h3 id="temp-title" className="mja-h3">Send this to {temp?.name.split(" ")[0]}</h3>
        <p className="mja-muted">It is shown only now. Send it privately.</p>
        <pre className="mja-temp">{shareText}</pre>
        <div className="mja-dialog-actions">
          <button type="button" className="mja-btn line" onClick={copy}>Copy</button>
          <a className="mja-btn line" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer">WhatsApp</a>
          <button type="button" className="mja-btn red" onClick={() => { tempDialog.current?.close(); setTemp(null); }}>Done</button>
        </div>
      </dialog>

      <dialog ref={confirmDialog} className="mja-dialog small" aria-labelledby="rm-title">
        <h3 id="rm-title" className="mja-h3">Remove {confirming?.name}?</h3>
        <p className="mja-muted">They are signed out and their account is deleted. To stop them for a while instead, switch them off.</p>
        <div className="mja-dialog-actions">
          <button type="button" className="mja-btn line" onClick={() => confirmDialog.current?.close()}>Keep</button>
          <button type="button" className="mja-btn red" onClick={() => { const m = confirming; confirmDialog.current?.close(); if (m) run(() => deleteMember(m.id)); }}>Remove</button>
        </div>
      </dialog>

      <Toast msg={toast} />
    </>
  );
}
