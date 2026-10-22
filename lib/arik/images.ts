import { sql } from "@/lib/store";

/* Arik's pictures: create images from a description, or edit a photo you share.
 *
 * Runs on Cloudflare Workers AI's free daily allowance with FLUX.2 [klein], a
 * Black Forest Labs model that both creates and edits (it can take up to four
 * photos as references). If that is unavailable, FLUX.1 [schnell] creates
 * images from text only.
 *
 * Needs two settings in Vercel and .env.local:
 *   CLOUDFLARE_ACCOUNT_ID   your Cloudflare account ID
 *   CLOUDFLARE_API_TOKEN    an API token with the "Workers AI" permission
 *
 * The team shares a daily limit (ARIK_IMAGE_DAILY, 20 by default) that resets
 * at midnight Lagos time, which keeps comfortably inside the free allowance. */

export const imagesConfigured = () => Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN);
export const dailyLimit = () => Math.max(1, Number(process.env.ARIK_IMAGE_DAILY) || 20);

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());   /* 2026-10-22 */

export async function imagesUsedToday() {
  const r = await sql<{ value: number }>("SELECT value FROM kv WHERE key = $1", [`images:${today()}`]).catch(() => []);
  return Number(r[0]?.value || 0);
}

/** Takes one image from today's allowance. False when it is used up. */
export async function takeImage(): Promise<boolean> {
  const r = await sql<{ value: number }>(
    `INSERT INTO kv (key, value, updated_at) VALUES ($1, '1'::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = to_jsonb((kv.value #>> '{}')::int + 1), updated_at = now()
     RETURNING value`, [`images:${today()}`]);
  if (Number(r[0].value) > dailyLimit()) { await giveBack(); return false; }
  return true;
}

/** Returns an image to the allowance when making it failed. */
export async function giveBack() {
  await sql(`UPDATE kv SET value = to_jsonb(GREATEST((value #>> '{}')::int - 1, 0)) WHERE key = $1`, [`images:${today()}`]).catch(() => {});
}

export type Shape = "square" | "portrait" | "landscape";
export const SIZES: Record<Shape, [number, number]> = { square: [1024, 1024], portrait: [832, 1216], landscape: [1216, 832] };

/** Guesses the shape from the request: flyers and stories are tall, banners are wide. */
export function shapeFor(text: string): Shape {
  if (/\b(flyer|poster|story|stories|portrait|tall|vertical|status|reel|tiktok|phone wallpaper)\b/i.test(text)) return "portrait";
  if (/\b(banner|cover|landscape|wide|header|youtube|thumbnail|horizontal|billboard|website hero)\b/i.test(text)) return "landscape";
  return "square";
}

const mimeOf = (b: Buffer) => b[0] === 0x89 ? "image/png" : b[0] === 0xff ? "image/jpeg" : b.subarray(8, 12).toString("ascii") === "WEBP" ? "image/webp" : "image/png";

async function cf(model: string, init: RequestInit) {
  const res = await fetch(`${process.env.ARIK_CF_BASE || "https://api.cloudflare.com/client/v4"}/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, ...(init.headers || {}) },
    signal: AbortSignal.timeout(90_000),
  });
  const j = await res.json().catch(() => ({})) as { result?: { image?: string }; errors?: { message: string }[] };
  if (!res.ok || !j.result?.image) throw new Error(j.errors?.[0]?.message || `Image service error ${res.status}`);
  const bytes = Buffer.from(j.result.image, "base64");
  return { bytes, mime: mimeOf(bytes) };
}

/** Creates an image, or edits the reference photos when they are given. */
export async function makeImage(prompt: string, shape: Shape, refs: { bytes: Buffer; mime: string }[] = []) {
  const [width, height] = SIZES[shape];
  const klein = process.env.ARIK_IMAGE_MODEL || "@cf/black-forest-labs/flux-2-klein-4b";
  try {
    const form = new FormData();
    form.append("prompt", prompt.slice(0, 2000));
    form.append("width", String(width));
    form.append("height", String(height));
    refs.slice(0, 4).forEach((r, i) => form.append(`input_image_${i}`, new Blob([new Uint8Array(r.bytes)], { type: r.mime }), `ref${i}.${r.mime.split("/")[1] || "jpg"}`));
    return { ...(await cf(klein, { method: "POST", body: form })), model: "FLUX.2 klein" };
  } catch (e) {
    if (refs.length) throw e;      /* editing needs FLUX.2; there is no text-only substitute for an edit */
    console.error("FLUX.2 failed, trying FLUX.1 schnell", e);
    return {
      ...(await cf(process.env.ARIK_IMAGE_FALLBACK || "@cf/black-forest-labs/flux-1-schnell", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: prompt.slice(0, 2000), steps: 6 }),
      })),
      model: "FLUX.1 schnell",
    };
  }
}

/** Instructions for turning a request into a strong image prompt. */
export const PROMPT_WRITER = `You write prompts for an image model (FLUX). Turn the person's request into ONE detailed English prompt.
- Describe subject, setting, composition, lighting, colours, lens or art style, and mood. Be concrete. 40 to 120 words.
- For MOJATECH (a Nigerian electrical, solar, inverter and CCTV company; brand colours deep navy #0b1238, royal blue #2a3291 and red #e0262b) use those colours when it is branding or marketing, and show Nigerian people and settings when people or places appear.
- Text in images: only include short text if asked, in double quotes, and keep it to a few words.
- If they shared photos to edit, write an EDIT instruction: say exactly what to change and what to keep the same (faces, products, layout).
- Refuse sexual content, anything involving minors in unsafe ways, real people in fake or embarrassing situations, gore, or hateful content: reply only "REFUSE: <short reason>".
Reply with the prompt only. No preamble, no quotes around it.`;
