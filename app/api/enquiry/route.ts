import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { dbConfigured } from "@/lib/store";
import { after } from "next/server";
import { addEnquiry, hashIp, recentFrom, KINDS, type Kind } from "@/lib/enquiries";
import { notify } from "@/lib/push";

/* Receives quote requests, orders and applications from the website and keeps
 * them for the admin. The visitor never waits on this: the form carries on to
 * WhatsApp whatever happens here. */

const clip = (v: unknown, n: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const ok = () => Response.json({ ok: true });

export async function POST(req: Request) {
  const h = await headers();
  const origin = h.get("origin");
  if (origin && new URL(origin).host !== h.get("host")) return Response.json({ ok: false }, { status: 403 });
  if (!dbConfigured()) return Response.json({ ok: false, reason: "unconfigured" }, { status: 503 });

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return Response.json({ ok: false }, { status: 400 });

  /* Bots: a hidden field people never see, and forms filled in faster than a
     person could. Answer "ok" so they learn nothing. */
  if (clip(body.website, 200) || Number(body.t) < 2500) return ok();

  const kind = (["quote", "order", "careers"] as Kind[]).find((k) => k === body.kind);
  if (!kind) return Response.json({ ok: false }, { status: 400 });

  const name = clip(body.name, 120), phone = clip(body.phone, 40), email = clip(body.email, 160);
  const fields = (Array.isArray(body.fields) ? body.fields : [])
    .slice(0, 20)
    .map((f) => (Array.isArray(f) ? [clip(f[0], 60), String(f[1] ?? "").trim().slice(0, 3000)] : ["", ""]))
    .filter(([k, v]) => k && v) as [string, string][];
  if (kind !== "order" && !phone && !email) return Response.json({ ok: false, reason: "contact" }, { status: 400 });

  const ipHash = hashIp((h.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown");
  if ((await recentFrom(ipHash).catch(() => 0)) >= 8) return ok();

  const get = (label: string) => fields.find(([k]) => k === label)?.[1] || "";
  const summary = clip(
    kind === "quote" ? [get("Service"), get("Area")].filter(Boolean).join(", ") :
    kind === "order" ? [get("Product"), get("Price")].filter(Boolean).join(", ") :
    [get("Programme"), get("School")].filter(Boolean).join(", "), 200);

  let id = "";
  try {
    id = await addEnquiry({ kind, name, phone, email, summary, fields, page: clip(body.page, 200), ipHash });
  } catch (e) {
    console.error("enquiry not saved", e);
    return Response.json({ ok: false }, { status: 500 });
  }
  revalidatePath("/admin", "layout");
  /* Phones are alerted after the visitor has their answer, so they never wait. */
  after(() => notify("enquiries", {
    title: kind === "order" ? `New order: ${get("Product") || "a product"}` : `New ${KINDS[kind].label.toLowerCase()}${name ? ` from ${name}` : ""}`,
    body: [summary, phone].filter(Boolean).join(" · ") || "Open the admin to see it.",
    url: `/admin/enquiries/${id}`, tag: `enq-${id}`,
  }));
  return ok();
}
