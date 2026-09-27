"use client";
import { useActionState } from "react";
import { loadSamples } from "./actions";

export default function Tools({ count, connected }: { count: number; connected: boolean }) {
  const [state, action, pending] = useActionState(async () => loadSamples(), null as null | { error?: string; ok?: string });
  return (
    <div className="adm-tools">
      <span>{count} products showing{connected ? "" : " (samples)"}</span>
      {connected && (
        <form action={action}>
          <button className="btn btn-line btn-sm" type="submit" disabled={pending}>
            {pending ? "Copying…" : "Copy the samples into my database"}
          </button>
        </form>
      )}
      {state?.ok && <b className="adm-good">{state.ok}</b>}
      {state?.error && <b className="adm-bad">{state.error}</b>}
    </div>
  );
}
