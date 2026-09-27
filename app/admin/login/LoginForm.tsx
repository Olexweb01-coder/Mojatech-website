"use client";
import { useActionState } from "react";
import { signIn } from "../actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(signIn, null as null | { error?: string });
  return (
    <form action={action} className="adm-form" style={{ marginTop: 24 }}>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
      </div>
      {state?.error && <p className="adm-bad">{state.error}</p>}
      <button className="btn btn-red" type="submit" disabled={pending}>{pending ? "Checking…" : "Sign in"}</button>
    </form>
  );
}
