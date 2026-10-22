"use client";
import { startTransition, useActionState, useState, useTransition } from "react";
import Link from "next/link";
import Toast, { nextToast, type ToastMsg } from "@/components/admin/Toast";
import { saveName, changePassword, signOutEverywhereElse, type Result } from "./actions";

export default function AccountForms({ me, first }: { me: { name: string; email: string; role: string; master: boolean; mustChange: boolean }; first: boolean }) {
  const [toast, setToast] = useState<ToastMsg>(null);
  const [, start] = useTransition();
  const [nameState, nameAction, nameBusy] = useActionState<Result, FormData>(saveName, null);
  const [pwState, pwAction, pwBusy] = useActionState<Result, FormData>(changePassword, null);
  const [seen, setSeen] = useState<number | undefined>(undefined);
  for (const st of [nameState, pwState]) {
    if (st?.at && st.at !== seen) { setSeen(st.at); setToast({ text: st.ok || st.error || "", tone: st.error ? "bad" : "good", at: st.at }); }
  }
  const submit = (fn: (d: FormData) => void) => (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const d = new FormData(e.currentTarget); startTransition(() => fn(d));
  };

  if (me.master) {
    return (
      <div className="mja-detail">
        <section className="mja-card">
          <h2 className="mja-h3">Signed in with the master password</h2>
          <p className="mja-muted">This sign-in has no account of its own. Create your owner account in Team, then sign in with your email.</p>
          <Link href="/admin/team" className="mja-btn red mja-self-start">Go to Team</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="mja-detail">
      {first ? (
        <section className="mja-card mja-callout">
          <h2 className="mja-h3">Welcome, {me.name.split(" ")[0]}. Choose your own password.</h2>
          <p className="mja-muted">You signed in with a temporary password. Pick one only you know to continue. Use at least 10 characters; a short sentence is easy to remember and hard to guess.</p>
        </section>
      ) : (
        <section className="mja-card">
          <h2 className="mja-h3">You</h2>
          <form className="mja-dialog-form" onSubmit={submit(nameAction)}>
            <div className="mja-field"><label htmlFor="ac-name">Name</label><input id="ac-name" name="name" defaultValue={me.name} required maxLength={80} autoComplete="name" /></div>
            <p className="mja-note">{me.email} · {me.role}</p>
            <button className="mja-btn line sm mja-self-start" type="submit" disabled={nameBusy}>Save name</button>
          </form>
        </section>
      )}

      <section className="mja-card">
        <h2 className="mja-h3">{first ? "Your new password" : "Change password"}</h2>
        <form className="mja-dialog-form" onSubmit={submit(pwAction)}>
          <input type="email" name="username" value={me.email} autoComplete="username" readOnly hidden />
          <div className="mja-field"><label htmlFor="ac-cur">{first ? "Temporary password" : "Current password"}</label><input id="ac-cur" name="current" type="password" required autoComplete="current-password" /></div>
          <div className="mja-two">
            <div className="mja-field"><label htmlFor="ac-new">New password</label><input id="ac-new" name="password" type="password" required minLength={10} autoComplete="new-password" /></div>
            <div className="mja-field"><label htmlFor="ac-new2">New password again</label><input id="ac-new2" name="password2" type="password" required minLength={10} autoComplete="new-password" /></div>
          </div>
          <button className="mja-btn red mja-self-start" type="submit" disabled={pwBusy}>{pwBusy ? "Saving…" : first ? "Save and continue" : "Change password"}</button>
        </form>
      </section>

      {!first && (
        <section className="mja-card">
          <h2 className="mja-h3">Devices</h2>
          <p className="mja-muted">Lost a phone, or signed in on someone else&apos;s computer? Sign out everywhere except here.</p>
          <button type="button" className="mja-btn line sm mja-self-start" onClick={() => start(async () => {
            const r = await signOutEverywhereElse();
            setToast({ text: r?.ok || r?.error || "", tone: r?.error ? "bad" : "good", at: nextToast() });
          })}>Sign out other devices</button>
        </section>
      )}
      <Toast msg={toast} />
    </div>
  );
}
