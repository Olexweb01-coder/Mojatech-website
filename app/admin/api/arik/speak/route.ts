import { guard } from "../guard";

/* Text to a natural voice. Tries Fish Audio's free voice directly (FISH_API_KEY),
 * then the same free voice through OpenRouter (OPENROUTER_API_KEY). If neither
 * is set up, the app speaks with the phone's built-in voice instead. */

export const maxDuration = 60;

export async function POST(req: Request) {
  const g = await guard(req);
  if (g.error) return g.error;
  const body = await req.json().catch(() => null) as { text?: string } | null;
  const text = String(body?.text || "")
    .replace(/```[\s\S]*?```/g, " (code shown on screen) ")
    .replace(/[*_#>`|]/g, "").replace(/\[(.*?)\]\(.*?\)/g, "$1").replace(/\s+/g, " ").trim().slice(0, 3000);
  if (!text) return Response.json({ error: "Nothing to say." }, { status: 400 });

  const tries: (() => Promise<Response | null>)[] = [];
  if (process.env.FISH_API_KEY) tries.push(() => fetch("https://api.fish.audio/v1/tts", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.FISH_API_KEY}`, "Content-Type": "application/json", model: process.env.ARIK_FISH_MODEL || "s2.1-pro-free" },
    body: JSON.stringify({ text, format: "mp3", ...(process.env.ARIK_VOICE_ID ? { reference_id: process.env.ARIK_VOICE_ID } : {}) }),
    signal: AbortSignal.timeout(40_000),
  }).catch(() => null));
  if (process.env.OPENROUTER_API_KEY) tries.push(() => fetch("https://openrouter.ai/api/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.ARIK_TTS_MODEL || "fish-audio/s2.1-pro-free", input: text, response_format: "mp3" }),
    signal: AbortSignal.timeout(40_000),
  }).catch(() => null));

  for (const attempt of tries) {
    const res = await attempt();
    if (res?.ok && res.body && (res.headers.get("content-type") || "").includes("audio")) {
      return new Response(res.body, { headers: { "Content-Type": res.headers.get("content-type") || "audio/mpeg", "Cache-Control": "no-store" } });
    }
    if (res) console.error("speak failed", res.status, (await res.text().catch(() => "")).slice(0, 200));
  }
  return Response.json({ error: "device-voice" }, { status: 503 });
}
