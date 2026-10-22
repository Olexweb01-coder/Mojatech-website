import { tick } from "@/lib/schedule";

/* The clock for reminders, follow-up nudges and the morning briefing.
 *
 * Call it every 5 minutes from a free scheduler such as cron-job.org:
 *   https://mojatechelectrical.com/api/cron/tick   with the header
 *   Authorization: Bearer <CRON_SECRET>
 * Vercel's own daily cron (vercel.json) also calls it, as a backstop. */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || new URL(req.url).searchParams.get("key") || "";
  if (!secret || given !== secret) return Response.json({ error: "Not allowed." }, { status: 401 });
  const result = await tick();
  return Response.json({ ok: true, ...result });
}
