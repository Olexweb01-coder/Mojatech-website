import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { dbConfigured } from "@/lib/store";
import { hashIp } from "@/lib/enquiries";
import { after } from "next/server";
import { addReview, recentReviewsFrom } from "@/lib/reviews";
import { notify } from "@/lib/push";

/* A review sent from the website's /review page. It waits in the admin until
 * approved, so nothing appears on the website without MOJATECH seeing it first. */

const clip = (v: unknown, n: number) => String(v ?? "").replace(/[ \t]+/g, " ").trim().slice(0, n);

export async function POST(req: Request) {
  const h = await headers();
  const origin = h.get("origin");
  if (origin && new URL(origin).host !== h.get("host")) return Response.json({ ok: false }, { status: 403 });
  if (!dbConfigured()) return Response.json({ ok: false, reason: "unconfigured" }, { status: 503 });

  const b = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!b) return Response.json({ ok: false }, { status: 400 });
  if (clip(b.website, 100) || Number(b.t) < 4000) return Response.json({ ok: true });   /* bots */

  const name = clip(b.name, 80), text = clip(b.text, 1200);
  const rating = Math.min(5, Math.max(1, Math.round(Number(b.rating)) || 5));
  if (!name || text.length < 10) return Response.json({ ok: false, reason: "short" }, { status: 400 });

  const ipHash = hashIp((h.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown");
  if ((await recentReviewsFrom(ipHash).catch(() => 0)) >= 3) return Response.json({ ok: true });

  try {
    await addReview({ name, place: clip(b.place, 80), rating, text, service: clip(b.service, 80), status: "pending", source: "website", ipHash });
  } catch (e) {
    console.error("review not saved", e);
    return Response.json({ ok: false }, { status: 500 });
  }
  revalidatePath("/admin", "layout");
  after(() => notify("reviews", { title: `New ${rating}-star review from ${name}`, body: text.slice(0, 160), url: "/admin/reviews", tag: "reviews" }));
  return Response.json({ ok: true });
}
