import { getMe } from "@/lib/admin-auth";
import { dbConfigured } from "@/lib/store";
import { ownerKey } from "@/lib/arik/store";
import { vapid, saveSubscription, removeSubscription, testAlert } from "@/lib/push";

/* This device's alerts: the public key to subscribe with, saving the
 * subscription, removing it, and sending a test. */

async function who(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return null;
  const me = await getMe();
  return me && dbConfigured() ? me : null;
}

export async function GET(req: Request) {
  if (!(await who(req))) return Response.json({ error: "Please sign in again." }, { status: 401 });
  return Response.json({ publicKey: (await vapid()).publicKey });
}

export async function POST(req: Request) {
  const me = await who(req);
  if (!me) return Response.json({ error: "Please sign in again." }, { status: 401 });
  const body = await req.json().catch(() => null) as { action?: string; subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } } } | null;
  if (body?.action === "test") {
    const n = await testAlert(ownerKey(me));
    return Response.json({ sent: n });
  }
  const s = body?.subscription;
  if (!s?.endpoint || !/^https:\/\//.test(s.endpoint) || !s.keys?.p256dh || !s.keys.auth) return Response.json({ error: "Bad subscription." }, { status: 400 });
  await saveSubscription(ownerKey(me), { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } }, req.headers.get("user-agent") || "");
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await who(req))) return Response.json({ error: "Please sign in again." }, { status: 401 });
  const { endpoint } = await req.json().catch(() => ({})) as { endpoint?: string };
  if (endpoint) await removeSubscription(endpoint);
  return Response.json({ ok: true });
}
