import { streamReply } from "@/lib/arik/providers";
import { addItem, fromLagos, ITEM_KINDS, REPEATS } from "@/lib/schedule";
import { recipients } from "@/lib/push";

/* "Remind me to call Tunde tomorrow at 10am", "set an alarm for 6:30",
 * "schedule a site visit in Lekki on Friday at 2pm for everyone":
 * Arik turns these into schedule items, which send alerts at the right time. */

export const REMIND_HINT = /\b(remind (me|us|everyone|everybody|the team|[a-z]+ to)|set (me )?(an? )?(alarm|reminder)|wake me|schedule (a|an|the|my)\b|add (a|an) (site visit|installation|meeting|reminder|delivery|follow[- ]?up)|book (a|an) (site visit|installation|meeting))/i;

const lagosNow = () => {
  const d = new Date();
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", ...o }).format(d);
  return { iso: new Date(d.getTime() + 3600_000).toISOString().slice(0, 16), weekday: f({ weekday: "long" }), pretty: f({ weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) };
};

type Parsed = { ok: boolean; question?: string; title?: string; kind?: string; when?: string; remind_before?: number; repeat?: string; for?: string; alarm?: boolean; location?: string };

/** Returns Arik's reply, or null when the message is not really a reminder. */
export async function handleReminder(text: string, owner: string, signal: AbortSignal): Promise<string | null> {
  const now = lagosNow();
  const team = (await recipients()).filter((r) => r.owner !== "master");
  let raw = "";
  try {
    await streamReply([
      { role: "system", content: `You turn a request into a schedule entry. It is now ${now.pretty} in Lagos (${now.iso}, ${now.weekday}). Team members: ${team.map((t) => t.name).join(", ") || "none"}.
Reply with JSON only, no other text:
{"ok":true,"title":"short action, e.g. Call Tunde about the 5kVA quote","kind":"reminder|visit|install|followup|meeting|delivery","when":"YYYY-MM-DDTHH:MM in Lagos time","remind_before":0|15|60|180|1440,"repeat":"none|daily|weekly|monthly","for":"me|everyone|<exact team member name>","alarm":true|false,"location":""}
Rules: "tomorrow", weekdays and "next week" are relative to now. A date without a time means 09:00. "In 2 hours" means now plus 2 hours. Site visits, installations and meetings get remind_before 60; plain reminders 0. "alarm" or "wake me" means alarm true. If the time is in the past, use the next occurrence.
If no time or date can be worked out at all, reply {"ok":false,"question":"a short question asking when"}. If it is not a request to be reminded or to schedule something, reply {"ok":false}.` },
      { role: "user", content: text },
    ], { intent: "fast", long: false, signal, onToken: (t) => { raw += t; } });
  } catch { return null; }

  let p: Parsed;
  try { p = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)); } catch { return null; }
  if (!p.ok) return p.question || null;
  if (!p.title || !p.when || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(p.when)) return null;

  const who = (p.for || "me").toLowerCase();
  const match = team.find((t) => t.name.toLowerCase() === who || t.name.toLowerCase().split(" ")[0] === who.split(" ")[0]);
  const assignee = who === "everyone" ? "everyone" : who === "me" || !match ? owner : match.owner;
  const kind = ITEM_KINDS[p.kind || ""] ? p.kind! : "reminder";
  const repeat = REPEATS[p.repeat || ""] ? p.repeat! : "none";
  const remind = [0, 15, 60, 180, 1440].includes(Number(p.remind_before)) ? Number(p.remind_before) : 0;
  const at = fromLagos(p.when);

  await addItem({
    title: p.title.slice(0, 140), kind, startsAt: at.toISOString(), location: (p.location || "").slice(0, 160), notes: "",
    assignee, remindBefore: remind, repeat, alarm: Boolean(p.alarm), enquiryId: null,
  }, owner);

  const when = new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: true }).format(at);
  const forWho = assignee === owner ? "" : assignee === "everyone" ? " for everyone" : ` for ${match?.name}`;
  const alert = remind ? ` I'll alert ${assignee === owner ? "you" : "them"} ${remind >= 1440 ? "a day" : remind >= 60 ? `${remind / 60} hour${remind > 60 ? "s" : ""}` : `${remind} minutes`} before.` : "";
  return `Done. **${ITEM_KINDS[kind]}${forWho}:** ${p.title}\n**When:** ${when}${repeat !== "none" ? ` (${REPEATS[repeat].toLowerCase()})` : ""}${p.alarm ? " · alarm" : ""}${p.location ? `\n**Where:** ${p.location}` : ""}\n\n${alert.trim()} You can change it in [Schedule](/admin/schedule).`.trim();
}
