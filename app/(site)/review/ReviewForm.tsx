"use client";
import { useState } from "react";
import { company } from "@/lib/data/company";

export default function ReviewForm({ services }: { services: string[] }) {
  const [openedAt] = useState(() => (typeof performance === "undefined" ? 0 : performance.now()));
  const [rating, setRating] = useState(5);
  const [f, setF] = useState({ name: "", place: "", service: "", text: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return setError("Please add your name.");
    if (f.text.trim().length < 10) return setError("Please write a little more about the job.");
    setError(""); setState("sending");
    try {
      const res = await fetch("/api/review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, rating, t: Math.round(performance.now() - openedAt) }),
      });
      if (!res.ok) throw new Error();
      setState("sent");
    } catch {
      setState("error");
    }
  };

  if (state === "sent") {
    return (
      <div className="form">
        <div className="sent on">
          <div className="tick" />
          <h3>Thank you, {f.name.split(" ")[0]}.</h3>
          <p className="lead" style={{ marginTop: 10 }}>Your review has reached MOJATECH. It appears on the website once the team has seen it.</p>
        </div>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
        <label>Leave this empty<input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website", e.target.value)} /></label>
      </div>

      <div className="field">
        <span className="flabel" id="rate-label">Your rating</span>
        <div className="rpick" role="radiogroup" aria-labelledby="rate-label">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`}
              className={n <= rating ? "on" : ""} onClick={() => setRating(n)}>★</button>
          ))}
        </div>
      </div>
      <div className="field">
        <label htmlFor="rv-text">What did MOJATECH do, and how did it go?</label>
        <textarea id="rv-text" value={f.text} maxLength={1200} onChange={(e) => set("text", e.target.value)}
          placeholder="e.g. They installed our 5kVA solar system in two days. Tidy work, and the light has been steady since." />
      </div>
      <div className="field">
        <label htmlFor="rv-name">Your name</label>
        <input id="rv-name" value={f.name} maxLength={80} autoComplete="name" onChange={(e) => set("name", e.target.value)} placeholder="As you want it shown, e.g. Tunde B." />
      </div>
      <div className="field">
        <label htmlFor="rv-place">Where (optional)</label>
        <input id="rv-place" value={f.place} maxLength={80} onChange={(e) => set("place", e.target.value)} placeholder="e.g. Ikeja, Lagos" />
      </div>
      <div className="field">
        <label htmlFor="rv-service">The job (optional)</label>
        <input id="rv-service" value={f.service} maxLength={80} list="rv-services" onChange={(e) => set("service", e.target.value)} placeholder="e.g. Solar installation" />
        <datalist id="rv-services">{services.map((s) => <option key={s} value={s} />)}</datalist>
      </div>

      {error && <p className="ferror" role="alert">{error}</p>}
      {state === "error" && <p className="ferror" role="alert">That did not send. Please try again, or WhatsApp {company.contact.phoneDisplay}.</p>}
      <div className="fnav">
        <button className="btn btn-red" type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send review"}</button>
      </div>
    </form>
  );
}
