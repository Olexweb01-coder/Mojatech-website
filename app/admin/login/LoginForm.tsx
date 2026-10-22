"use client";
import { useActionState, useState } from "react";
import { signIn } from "../actions";

export default function LoginForm({ hasAccounts }: { hasAccounts: boolean }) {
  const [state, action, pending] = useActionState(signIn, null as null | { error?: string });
  const [master, setMaster] = useState(!hasAccounts);
  return (
    <form action={action} className="mja-form">
      {!master && (
        <div className="mja-field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="username" inputMode="email" required autoFocus />
        </div>
      )}
      <div className="mja-field">
        <label htmlFor="password">{master ? "Admin password" : "Password"}</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus={master} />
      </div>
      {state?.error && <p className="mja-bad" role="alert">{state.error}</p>}
      <button className="mja-btn red" type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      {hasAccounts && (
        <button type="button" className="mja-linkbtn mja-login-alt" onClick={() => setMaster((m) => !m)}>
          {master ? "Sign in with your email instead" : "Use the master password"}
        </button>
      )}
    </form>
  );
}
