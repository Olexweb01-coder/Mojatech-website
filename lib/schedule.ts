import { sql, kvGet, kvSet, dbConfigured } from "@/lib/store";
import { notify, recipients } from "@/lib/push";
import { ROLES } from "@/lib/admin-auth";
import { KINDS } from "@/lib/enquiries";

/* The schedule: reminders, site visits, installations, follow-ups and meetings,
 * and the automatic alerts that run on their own. */

export const ITEM_KINDS: Record<string, string> = {
  reminder: "Reminder", visit: "Site visit", install: "Installation", followup: "Follow-up", meeting: "Meeting", delivery: "Delivery",
};
export const REPEATS: Record<string, string> = { none: "Does not repeat", daily: "Every day", weekly: "Every week", monthly: "Every month" };
export const REMIND: [number, string][] = [[0, "At the time"], [15, "15 minutes before"], [60, "1 hour before"], [180, "3 hours before"], [1440, "1 day before"]];

export type Item = {
  id: string; title: string; kind: string; startsAt: string; location: string; notes: string;
  assignee: string; remindBefore: number; repeat: string; alarm: boolean; done: boolean; enquiryId: string | null; createdBy: string;
};

type Row = {
  id: string; title: string; kind: string; starts_at: Date; location: string; notes: string; assignee: string;
  remind_before: number; repeat: string; alarm: boolean; done: boolean; enquiry_id: string | null; created_by: string;
};
const toItem = (r: Row): Item => ({
  id: String(r.id), title: r.title, kind: r.kind, startsAt: r.starts_at.toISOString(), location: r.location, notes: r.notes,
  assignee: r.assignee, remindBefore: r.remind_before, repeat: r.repeat, alarm: r.alarm, done: r.done,
  enquiryId: r.enquiry_id ? String(r.enquiry_id) : null, createdBy: r.created_by,
});

/** What this person sees: their own items and everyone's shared ones. */
export async function listItems(owner: string, includeDone = false): Promise<Item[]> {
  if (!dbConfigured()) return [];
  const rows = await sql<Row>(
    `SELECT * FROM schedule WHERE (assignee = $1 OR assignee = 'everyone' OR created_by = $1) ${includeDone ? "" : "AND (NOT done OR starts_at > now() - interval '2 days')"}
     ORDER BY done, starts_at LIMIT 300`, [owner]);
  return rows.map(toItem);
}

export async function getItem(id: string) {
  if (!/^\d{1,18}$/.test(id)) return undefined;
  const r = await sql<Row>("SELECT * FROM schedule WHERE id = $1", [id]);
  return r[0] ? toItem(r[0]) : undefined;
}

export type ItemInput = Omit<Item, "id" | "done" | "createdBy">;

export async function addItem(i: ItemInput, createdBy: string) {
  const r = await sql<{ id: string }>(
    `INSERT INTO schedule (title, kind, starts_at, location, notes, assignee, remind_before, repeat, alarm, enquiry_id, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
    [i.title, i.kind, i.startsAt, i.location, i.notes, i.assignee, i.remindBefore, i.repeat, i.alarm, i.enquiryId, createdBy]);
  return String(r[0].id);
}

export async function updateItem(id: string, i: ItemInput) {
  await sql(
    `UPDATE schedule SET title = $2, kind = $3, starts_at = $4, location = $5, notes = $6, assignee = $7, remind_before = $8,
       repeat = $9, alarm = $10, notified_at = NULL WHERE id = $1`,
    [id, i.title, i.kind, i.startsAt, i.location, i.notes, i.assignee, i.remindBefore, i.repeat, i.alarm]);
}

export async function setDone(id: string, done: boolean) {
  await sql("UPDATE schedule SET done = $2 WHERE id = $1", [id, done]);
}

export async function deleteItem(id: string) {
  await sql("DELETE FROM schedule WHERE id = $1", [id]);
}

/* ---------- Lagos time ---------- */

/** "2026-10-22T09:30" typed on a phone, read as Lagos time (UTC+1, no daylight saving). */
export const fromLagos = (local: string) => new Date(`${local}:00+01:00`);
export const toLagosInput = (iso: string) => new Date(new Date(iso).getTime() + 3600_000).toISOString().slice(0, 16);
const lagosDate = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(d);
const lagosHour = (d = new Date()) => Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", hour: "2-digit", hour12: false }).format(d));
const lagosTime = (iso: string) => new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso));

/* ---------- The clock ---------- */

/** Runs everything that is due. Called every few minutes by a scheduler
 *  (see app/api/cron/tick), and opportunistically when the admin is opened. */
export async function tick() {
  if (!dbConfigured()) return { skipped: true };
  /* Only one run at a time, at most once a minute. */
  const claimed = await sql<{ key: string }>(
    `INSERT INTO kv (key, value, updated_at) VALUES ('tick', 'true', now())
     ON CONFLICT (key) DO UPDATE SET updated_at = now() WHERE kv.updated_at < now() - interval '50 seconds'
     RETURNING key`).catch(() => []);
  if (!claimed.length) return { skipped: true };

  const out = { reminders: 0, followups: 0, briefing: 0 };

  /* 1. Reminders, site visits and jobs whose alert time has come. */
  const due = await sql<Row>(
    `SELECT * FROM schedule WHERE NOT done AND notified_at IS NULL
       AND starts_at - (remind_before || ' minutes')::interval <= now()
       AND starts_at > now() - interval '1 day'
     ORDER BY starts_at LIMIT 50`);
  for (const r of due) {
    const i = toItem(r);
    const soon = i.remindBefore > 0 ? ` · ${lagosTime(i.startsAt)}` : "";
    await notify("schedule", {
      title: `${ITEM_KINDS[i.kind] || "Reminder"}${soon}: ${i.title}`,
      body: [i.location, i.notes].filter(Boolean).join(" · ").slice(0, 180) || (i.remindBefore ? `Starts at ${lagosTime(i.startsAt)}` : "Now"),
      url: "/admin/schedule", tag: `sched-${i.id}`, alarm: i.alarm,
    }, i.assignee === "everyone" ? undefined : [i.assignee]);
    out.reminders++;
    if (i.repeat !== "none") {
      const step = i.repeat === "daily" ? "1 day" : i.repeat === "weekly" ? "7 days" : "1 month";
      await sql(`UPDATE schedule SET starts_at = starts_at + interval '${step}', notified_at = NULL WHERE id = $1`, [i.id]);
    } else {
      await sql("UPDATE schedule SET notified_at = now() WHERE id = $1", [i.id]);
    }
  }

  /* 2. Follow-up nudges: new enquiries unanswered after 2 hours, and quotes with no
        update for 3 days. Each enquiry is nudged once per change. */
  const stale = await sql<{ id: string; kind: keyof typeof KINDS; name: string; summary: string; status: string }>(
    `SELECT id, kind, name, summary, status FROM enquiries
      WHERE ((status = 'new' AND created_at < now() - interval '2 hours' AND created_at > now() - interval '3 days')
          OR (status IN ('contacted', 'quoted') AND updated_at < now() - interval '3 days' AND updated_at > now() - interval '30 days'))
        AND (nudged_at IS NULL OR nudged_at < updated_at)
      LIMIT 10`).catch(() => []);
  for (const e of stale) {
    await notify("followups", {
      title: e.status === "new" ? `Still waiting: ${e.name || KINDS[e.kind]?.label}` : `Follow up with ${e.name || "the customer"}`,
      body: e.status === "new" ? `${KINDS[e.kind]?.label}${e.summary ? `: ${e.summary}` : ""}. Nobody has replied yet.` : `${KINDS[e.kind]?.label} has been "${e.status}" for 3 days.`,
      url: `/admin/enquiries/${e.id}`, tag: `nudge-${e.id}`,
    });
    await sql("UPDATE enquiries SET nudged_at = now(), updated_at = updated_at WHERE id = $1", [e.id]);
    out.followups++;
  }

  /* 3. Morning briefing at 7:30, once a day, to each person. */
  const today = lagosDate();
  const minute = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", minute: "2-digit" }).format(new Date()));
  if ((lagosHour() > 7 || (lagosHour() === 7 && minute >= 30)) && lagosHour() < 12 && (await kvGet<string>("briefing")) !== today) {
    await kvSet("briefing", today);
    const [newEnq, waitingReviews] = await Promise.all([
      sql<{ n: string }>("SELECT count(*)::text AS n FROM enquiries WHERE seen_at IS NULL").then((r) => Number(r[0].n)).catch(() => 0),
      sql<{ n: string }>("SELECT count(*)::text AS n FROM reviews WHERE status = 'pending'").then((r) => Number(r[0].n)).catch(() => 0),
    ]);
    for (const p of await recipients()) {
      const mine = await sql<{ title: string; starts_at: Date }>(
        `SELECT title, starts_at FROM schedule WHERE NOT done AND (assignee = $1 OR assignee = 'everyone')
           AND starts_at >= now() AND (starts_at AT TIME ZONE 'Africa/Lagos')::date = $2::date ORDER BY starts_at LIMIT 5`, [p.owner, today]).catch(() => []);
      const parts: string[] = [];
      if (mine.length) parts.push(`Today: ${mine.map((m) => `${lagosTime(m.starts_at.toISOString())} ${m.title}`).join("; ")}`);
      if (ROLES[p.role].perms.includes("enquiries") && newEnq) parts.push(`${newEnq} unread enquir${newEnq === 1 ? "y" : "ies"}`);
      if (ROLES[p.role].perms.includes("reviews") && waitingReviews) parts.push(`${waitingReviews} review${waitingReviews === 1 ? "" : "s"} waiting`);
      if (!parts.length) continue;
      out.briefing += await notify("briefing", { title: "Good morning. Here is today.", body: parts.join(" · ").slice(0, 220), url: "/admin/schedule", tag: `brief-${today}` }, [p.owner]);
    }
  }
  return out;
}

/** Runs the clock in the background if it has not run in the last minute. */
export function maybeTick() {
  void tick().catch((e) => console.error("tick failed", e));
}
