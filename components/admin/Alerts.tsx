"use client";
import { useEffect, useState, useTransition } from "react";
import { saveAlerts } from "@/app/admin/(app)/account/actions";

/* Turning phone alerts on for this device, choosing which ones, and testing.
 *
 * iPhones only allow alerts for apps added to the Home Screen (iOS 16.4 and
 * later), so on an iPhone in Safari this explains how to add it first. */

type Kind = { key: string; label: string; hint: string };
type State = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

const urlB64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

async function registration() {
  const existing = await navigator.serviceWorker.getRegistration("/admin");
  if (existing) return existing;
  return navigator.serviceWorker.register(process.env.NODE_ENV === "production" ? "/admin-sw.js" : "/admin-sw.js?dev=1", { scope: "/admin" });
}

export default function Alerts({ kinds, prefs, compact = false }: { kinds: Kind[]; prefs: Record<string, boolean>; compact?: boolean }) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [choice, setChoice] = useState(prefs);
  const [, start] = useTransition();

  useEffect(() => {
    void (async () => {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setState(ios && !standalone ? "ios-install" : "unsupported"); return;
      }
      if (Notification.permission === "denied") { setState("denied"); return; }
      const reg = await registration().catch(() => null);
      const sub = await reg?.pushManager.getSubscription().catch(() => null);
      setState(sub && Notification.permission === "granted" ? "on" : "off");
    })();
  }, []);

  const enable = async () => {
    setBusy(true); setMsg("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setState(perm === "denied" ? "denied" : "off"); return; }
      const reg = await registration();
      await navigator.serviceWorker.ready;
      const { publicKey } = await fetch("/admin/api/push").then((r) => r.json());
      const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64(publicKey) });
      const res = await fetch("/admin/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription: sub.toJSON() }) });
      if (!res.ok) throw new Error();
      setState("on");
      setMsg("Alerts are on for this device.");
    } catch {
      setMsg("Could not switch alerts on. Try again, or check the browser's notification settings.");
    } finally { setBusy(false); }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const reg = await registration();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/admin/api/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setState("off"); setMsg("Alerts are off for this device.");
    } finally { setBusy(false); }
  };

  const test = async () => {
    setBusy(true);
    const r = await fetch("/admin/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "test" }) }).then((x) => x.json()).catch(() => ({ sent: 0 }));
    setMsg(r.sent ? "Test sent. It should appear in a few seconds." : "No device received it. Switch alerts on first.");
    setBusy(false);
  };

  const toggle = (k: string, v: boolean) => {
    const next = { ...choice, [k]: v };
    setChoice(next);
    start(async () => { const r = await saveAlerts(next); setMsg(r?.ok || r?.error || ""); });
  };

  if (compact && state === "on") return null;

  return (
    <section className="mja-card mja-alerts">
      <div className="mja-card-head">
        <h2 className="mja-h3">Phone alerts</h2>
        {state === "on" && <span className="mja-pill s-won">On for this device</span>}
      </div>

      {state === "loading" && <p className="mja-muted">Checking this device…</p>}
      {state === "unsupported" && <p className="mja-muted">This browser cannot show alerts. On Android use Chrome; on a computer use Chrome, Edge or Firefox.</p>}
      {state === "ios-install" && (
        <div className="mja-muted">
          <p>On iPhone, alerts work once MOJATECH Admin is on your Home Screen:</p>
          <ol className="mja-steps-list">
            <li>Tap the <b>Share</b> button in Safari.</li>
            <li>Choose <b>Add to Home Screen</b>, then <b>Add</b>.</li>
            <li>Open MOJATECH Admin from the Home Screen and switch alerts on here.</li>
          </ol>
        </div>
      )}
      {state === "denied" && <p className="mja-muted">Alerts are blocked for this site. Allow notifications for {typeof location !== "undefined" ? location.host : "this site"} in the browser or phone settings, then reload.</p>}
      {state === "off" && (
        <>
          <p className="mja-muted">Get a notification the moment an enquiry or order arrives, and for your reminders, even when the app is closed.</p>
          <button type="button" className="mja-btn red mja-self-start" onClick={enable} disabled={busy}>{busy ? "Switching on…" : "Switch on alerts"}</button>
        </>
      )}
      {state === "on" && !compact && (
        <>
          <div className="mja-alert-kinds">
            {kinds.map((k) => (
              <label key={k.key} className="mja-toggle">
                <span><b>{k.label}</b><small>{k.hint}</small></span>
                <span className="mja-switch"><input type="checkbox" role="switch" checked={choice[k.key] !== false} onChange={(e) => toggle(k.key, e.target.checked)} /><span aria-hidden="true" /></span>
              </label>
            ))}
          </div>
          <p className="mja-note">These choices apply on all your devices.</p>
          <div className="mja-more">
            <button type="button" className="mja-btn line sm" onClick={test} disabled={busy}>Send a test</button>
            <button type="button" className="mja-btn line sm" onClick={disable} disabled={busy}>Turn off on this device</button>
          </div>
        </>
      )}
      {msg && <p className="mja-note" role="status">{msg}</p>}
    </section>
  );
}
