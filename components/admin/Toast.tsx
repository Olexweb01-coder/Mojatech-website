"use client";
import { useEffect, useState } from "react";

/* A short message at the bottom of the screen ("Saved.", "Hidden from the website.").
 * Pass a new `at` (a timestamp) to show the same message again. */
export type ToastMsg = { text: string; tone?: "good" | "bad"; at: number } | null;

let seq = 1;
/** A fresh id for each message, so repeating the same text still shows it. */
export const nextToast = () => ++seq;

export default function Toast({ msg }: { msg: ToastMsg }) {
  const [shown, setShown] = useState<ToastMsg>(null);
  const [prevAt, setPrevAt] = useState<number | undefined>(undefined);
  if (msg && msg.at !== prevAt) { setPrevAt(msg.at); setShown(msg); }

  useEffect(() => {
    if (!shown) return;
    const id = window.setTimeout(() => setShown(null), shown.tone === "bad" ? 6000 : 3200);
    return () => window.clearTimeout(id);
  }, [shown]);

  return (
    <div className="mja-toast-wrap" aria-live="polite" role="status">
      {shown && (
        <p key={shown.at} className={"mja-toast" + (shown.tone === "bad" ? " bad" : "")} onClick={() => setShown(null)}>
          {shown.text}
        </p>
      )}
    </div>
  );
}
