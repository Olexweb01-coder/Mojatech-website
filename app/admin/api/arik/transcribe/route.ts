import { guard } from "../guard";
import { listAllProducts } from "@/lib/store";
import { company } from "@/lib/data/company";

/* Voice to text, tuned for accuracy.
 *
 * Uses Whisper large-v3 on Groq (free), the most accurate Whisper model and the
 * best of them with Nigerian accents, and falls back to the faster large-v3-turbo
 * if that is busy. Whisper is told the words it is likely to hear (MOJATECH,
 * product names, kVA, places in Lagos), which stops it mishearing them.
 * Without a Groq key the app uses the phone's own speech recognition. */

export const maxDuration = 60;

const VOCAB = [
  "MOJATECH", "Arik", "kVA", "kWh", "inverter", "hybrid inverter", "lithium battery", "tubular battery", "solar panel", "monocrystalline",
  "charge controller", "MPPT", "CCTV", "DVR", "NVR", "distribution board", "changeover", "AVR", "earthing", "surge protector",
  "naira", "NEPA", "Lagos", "Ikeja", "Lekki", "Ajah", "Ikorodu", "Surulere", "Yaba", "Abeokuta", "Ogun", "Ibadan", "Abuja",
];

async function hint() {
  const products = await listAllProducts().then((p) => p.slice(0, 20).map((x) => x.name)).catch(() => []);
  /* Whisper reads only the last ~224 tokens of the hint, so keep it tight. */
  return `${company.short} admin. ${[...VOCAB, ...products].join(", ")}.`.slice(0, 700);
}

export async function POST(req: Request) {
  const g = await guard(req);
  if (g.error) return g.error;
  const key = process.env.GROQ_API_KEY;
  if (!key) return Response.json({ error: "no-groq" }, { status: 503 });

  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof File) || audio.size < 800) return Response.json({ error: "Nothing was heard. Try again." }, { status: 400 });
  if (audio.size > 20 * 1024 * 1024) return Response.json({ error: "That recording is too long." }, { status: 413 });
  const lang = String(form?.get("language") || "");
  const prompt = await hint();

  const models = [process.env.ARIK_WHISPER || "whisper-large-v3", process.env.ARIK_WHISPER_FAST || "whisper-large-v3-turbo"];
  for (const model of models) {
    const out = new FormData();
    out.append("file", audio, audio.name || "voice.webm");
    out.append("model", model);
    out.append("response_format", "verbose_json");
    out.append("temperature", "0");
    out.append("prompt", prompt);
    if (/^[a-z]{2}$/.test(lang)) out.append("language", lang);

    const res = await fetch(`${process.env.ARIK_GROQ_BASE || "https://api.groq.com/openai/v1"}/audio/transcriptions`, {
      method: "POST", headers: { Authorization: `Bearer ${key}` }, body: out, signal: AbortSignal.timeout(45_000),
    }).catch(() => null);
    if (!res?.ok) { console.error("transcribe failed", model, res?.status, (await res?.text().catch(() => ""))?.slice(0, 200)); continue; }

    const j = await res.json() as { text?: string; segments?: { text: string; no_speech_prob?: number; avg_logprob?: number }[] };
    /* Drop stretches Whisper itself thinks were not speech (generator hum, traffic),
       which is where invented words usually come from. */
    const text = j.segments?.length
      ? j.segments.filter((s) => (s.no_speech_prob ?? 0) < 0.6 || (s.avg_logprob ?? 0) > -0.5).map((s) => s.text).join("").trim()
      : (j.text || "").trim();
    return Response.json({ text });
  }
  return Response.json({ error: "Could not understand the recording. Try again." }, { status: 502 });
}
