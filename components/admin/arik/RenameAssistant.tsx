"use client";
import { useActionState } from "react";
import { renameAssistant } from "@/app/admin/(app)/arik-actions";

export default function RenameAssistant({ name }: { name: string }) {
  const [state, action, busy] = useActionState(renameAssistant, null);
  return (
    <details className="mjr-rename">
      <summary>Rename {name}</summary>
      <form action={action} className="mjr-rename-form">
        <label className="mja-sr" htmlFor="as-name">Assistant name</label>
        <input id="as-name" name="name" defaultValue={name} maxLength={24} required />
        <button className="mja-btn line sm" type="submit" disabled={busy}>Save</button>
      </form>
      {state?.error && <p className="mja-bad">{state.error}</p>}
      {state?.ok && <p className="mja-good">{state.ok}</p>}
    </details>
  );
}
