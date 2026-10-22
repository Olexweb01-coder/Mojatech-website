import webpush from "web-push";
import { sql, kvGet, kvSet, dbConfigured } from "@/lib/store";
import { ROLES, isRole, type Perm } from "@/lib/admin-auth";

/* Phone notifications (Web Push).
 *
 * The keys that identify MOJATECH to Apple, Google and Mozilla's push services
 * are created once and kept in the database, so there is nothing to set up.
 * (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY in Vercel override them if you prefer.)
 *
 * Each person chooses which alerts they get (Your account → Alerts); the choice
 * applies to all their phones and computers. */

export type AlertKind = "enquiries" | "reviews" | "schedule" | "briefing" | "followups";
export const ALERTS: Record<AlertKind, { label: string; hint: string; perm?: Perm }> = {
  enquiries: { label: "New enquiries and orders", hint: "The moment a quote request, order or application arrives", perm: "enquiries" },
  schedule: { label: "Reminders and schedule", hint: "Your reminders, site visits and jobs, at the time you set" },
  followups: { label: "Follow-up nudges", hint: "Quotes waiting too long for a reply or a follow-up", perm: "enquiries" },
  reviews: { label: "New reviews", hint: "When a customer review is waiting for approval", perm: "reviews" },
  briefing: { label: "Morning briefing", hint: "At 7:30am: today's jobs and what is waiting" },
};

type Keys = { publicKey: string; privateKey: string };

let ready: Promise<Keys> | null = null;
export function vapid(): Promise<Keys> {
  if (!ready) ready = (async () => {
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) return { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
    const saved = await kvGet<Keys>("vapid");
    if (saved?.publicKey) return saved;
    const k = webpush.generateVAPIDKeys();
    await kvSet("vapid", k);
    return k;
  })().catch((e) => { ready = null; throw e; });
  return ready;
}

/* ---------- Devices ---------- */

export async function saveSubscription(owner: string, sub: { endpoint: string; keys: { p256dh: string; auth: string } }, agent: string) {
  await sql(
    `INSERT INTO push_subs (endpoint, owner, keys, agent) VALUES ($1,$2,$3,$4)
     ON CONFLICT (endpoint) DO UPDATE SET owner = $2, keys = $3, agent = $4`,
    [sub.endpoint, owner, JSON.stringify(sub.keys), agent.slice(0, 200)]);
}

export async function removeSubscription(endpoint: string) {
  await sql("DELETE FROM push_subs WHERE endpoint = $1", [endpoint]);
}

export async function devicesOf(owner: string) {
  return sql<{ endpoint: string; agent: string; created_at: Date; last_ok_at: Date | null }>(
    "SELECT endpoint, agent, created_at, last_ok_at FROM push_subs WHERE owner = $1 ORDER BY created_at DESC", [owner]);
}

/* ---------- Preferences ---------- */

const DEFAULTS: Record<AlertKind, boolean> = { enquiries: true, schedule: true, followups: true, reviews: true, briefing: true };

export async function prefsOf(owner: string): Promise<Record<AlertKind, boolean>> {
  return { ...DEFAULTS, ...((await kvGet<Partial<Record<AlertKind, boolean>>>(`alerts:${owner}`).catch(() => undefined)) || {}) };
}
export async function setPrefs(owner: string, p: Record<AlertKind, boolean>) {
  await kvSet(`alerts:${owner}`, p);
}

/* ---------- Who is who ---------- */

/** Everyone who could receive alerts, with their role. "master" is the owner's master-password sign-in. */
export async function recipients() {
  const users = await sql<{ id: string; name: string; role: string }>("SELECT id, name, role FROM users WHERE active");
  return [
    { owner: "master", name: "Owner", role: "owner" as const },
    ...users.filter((u) => isRole(u.role)).map((u) => ({ owner: `u${u.id}`, name: u.name, role: u.role as keyof typeof ROLES })),
  ];
}

/* ---------- Sending ---------- */

export type Note = {
  title: string; body: string; url?: string; tag?: string;
  alarm?: boolean;            /* stays on screen until dismissed, with a longer vibration */
  badge?: number;             /* number on the app icon, where the phone supports it */
};

async function sendTo(owner: string, note: Note) {
  const subs = await sql<{ endpoint: string; keys: { p256dh: string; auth: string } }>("SELECT endpoint, keys FROM push_subs WHERE owner = $1", [owner]);
  if (!subs.length) return 0;
  const k = await vapid();
  const payload = JSON.stringify({ ...note, url: note.url || "/admin" });
  let sent = 0;
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload, {
        vapidDetails: { subject: process.env.VAPID_SUBJECT || "mailto:info@mojatechelectrical.com", publicKey: k.publicKey, privateKey: k.privateKey },
        TTL: note.alarm ? 3600 : 86400,
        urgency: note.alarm ? "high" : "normal",
        topic: note.tag?.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32) || undefined,
      });
      sent++;
      void sql("UPDATE push_subs SET last_ok_at = now() WHERE endpoint = $1", [s.endpoint]).catch(() => {});
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      /* 404/410: the phone unsubscribed or the app was removed. Forget it. */
      if (code === 404 || code === 410) await removeSubscription(s.endpoint).catch(() => {});
      else console.error("push failed", code, (e as Error).message?.slice(0, 120));
    }
  }));
  return sent;
}

/** Sends an alert to everyone whose role and preferences want this kind of alert. */
export async function notify(kind: AlertKind, note: Note, only?: string[]) {
  if (!dbConfigured()) return 0;
  try {
    const perm = ALERTS[kind].perm;
    const people = (await recipients()).filter((r) => (!only || only.includes(r.owner)) && (!perm || ROLES[r.role].perms.includes(perm)));
    let n = 0;
    for (const r of people) {
      if (!(await prefsOf(r.owner))[kind]) continue;
      n += await sendTo(r.owner, note);
    }
    return n;
  } catch (e) {
    console.error("notify failed", e);
    return 0;
  }
}

/** A test alert to one person's devices. */
export async function testAlert(owner: string) {
  return sendTo(owner, { title: "MOJATECH Admin", body: "Alerts are working on this device.", url: "/admin", tag: "test" });
}
