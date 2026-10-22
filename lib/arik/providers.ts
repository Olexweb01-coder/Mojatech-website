/* Arik's brains: several free AI services, used one after another.
 *
 * All four speak the same "OpenAI-compatible" language, so one piece of code
 * talks to every one of them. For each kind of request there is an ordered list
 * of services; if one is busy, over its free limit, or down, the next is tried
 * straight away, so a reply still arrives.
 *
 *   Groq       very fast; everyday questions, and live web search (Compound)
 *   Gemini     reads photos and long documents (very large memory)
 *   Mistral    big monthly allowance; long, careful writing
 *   OpenRouter free models as a last resort
 *
 * Keys go in Vercel and .env.local: GROQ_API_KEY, GEMINI_API_KEY,
 * MISTRAL_API_KEY, OPENROUTER_API_KEY. Any one is enough to start; more keys
 * means fewer limits. Model names can be changed without touching code, using
 * the ARIK_* settings below, if a service renames its models. */

export type Intent = "fast" | "deep" | "web" | "vision";

type Provider = "groq" | "gemini" | "mistral" | "openrouter";

type Route = { provider: Provider; model: string; label: string; extra?: Record<string, unknown> };

const env = (k: string, d: string) => process.env[k] || d;

/* ARIK_<PROVIDER>_BASE can point a service at a proxy (or a test server). */
const BASE: Record<Provider, string> = {
  groq: process.env.ARIK_GROQ_BASE || "https://api.groq.com/openai/v1",
  gemini: process.env.ARIK_GEMINI_BASE || "https://generativelanguage.googleapis.com/v1beta/openai",
  mistral: process.env.ARIK_MISTRAL_BASE || "https://api.mistral.ai/v1",
  openrouter: process.env.ARIK_OPENROUTER_BASE || "https://openrouter.ai/api/v1",
};

const KEY: Record<Provider, () => string | undefined> = {
  groq: () => process.env.GROQ_API_KEY,
  gemini: () => process.env.GEMINI_API_KEY,
  mistral: () => process.env.MISTRAL_API_KEY,
  openrouter: () => process.env.OPENROUTER_API_KEY,
};

export const configured = () => (Object.keys(KEY) as Provider[]).filter((p) => KEY[p]());

/** OpenRouter's free models change often, so the list is read from OpenRouter
 *  (once an hour) and the most capable free one is used. */
let orCache: { at: number; model: string } | null = null;
async function openRouterFree(): Promise<string> {
  const pinned = process.env.ARIK_OPENROUTER_MODEL;
  if (pinned) return pinned;
  if (orCache && Date.now() - orCache.at < 3600_000) return orCache.model;
  try {
    const r = await fetch(`${BASE.openrouter}/models`, { signal: AbortSignal.timeout(5000) });
    const { data } = await r.json() as { data: { id: string; context_length?: number }[] };
    const free = data.filter((m) => m.id.endsWith(":free") && (m.context_length || 0) >= 32000);
    const rank = (id: string) => ["deepseek", "qwen", "gpt-oss", "llama", "gemma", "mistral"].findIndex((k) => id.includes(k));
    free.sort((a, b) => ((rank(a.id) + 99) % 99) - ((rank(b.id) + 99) % 99) || (b.context_length || 0) - (a.context_length || 0));
    orCache = { at: Date.now(), model: free[0]?.id || "openrouter/free" };
  } catch {
    orCache = { at: Date.now(), model: "openrouter/free" };
  }
  return orCache.model;
}

const G_FAST = () => env("ARIK_GROQ_FAST", "openai/gpt-oss-120b");
const G_LIGHT = () => env("ARIK_GROQ_LIGHT", "openai/gpt-oss-20b");
const G_WEB = () => env("ARIK_GROQ_WEB", "groq/compound");
const GM_LITE = () => env("ARIK_GEMINI_LITE", "gemini-flash-lite-latest");
const GM_FLASH = () => env("ARIK_GEMINI_FLASH", "gemini-flash-latest");
const M_LARGE = () => env("ARIK_MISTRAL", "mistral-large-latest");
const M_SMALL = () => env("ARIK_MISTRAL_SMALL", "mistral-small-latest");

/** The order services are tried in, for each kind of request. */
function plan(intent: Intent, long: boolean): Route[] {
  const fast: Route[] = [
    { provider: "groq", model: G_FAST(), label: "Groq", extra: { reasoning_effort: "low" } },
    { provider: "groq", model: G_LIGHT(), label: "Groq", extra: { reasoning_effort: "low" } },
    { provider: "gemini", model: GM_LITE(), label: "Gemini" },
    { provider: "mistral", model: M_SMALL(), label: "Mistral" },
    { provider: "openrouter", model: "", label: "OpenRouter" },
  ];
  const deep: Route[] = [
    { provider: "gemini", model: GM_FLASH(), label: "Gemini" },
    { provider: "mistral", model: M_LARGE(), label: "Mistral" },
    { provider: "groq", model: G_FAST(), label: "Groq", extra: { reasoning_effort: "high" } },
    { provider: "gemini", model: GM_LITE(), label: "Gemini" },
    { provider: "openrouter", model: "", label: "OpenRouter" },
  ];
  const vision: Route[] = [
    { provider: "gemini", model: GM_FLASH(), label: "Gemini" },
    { provider: "gemini", model: GM_LITE(), label: "Gemini" },
    { provider: "mistral", model: env("ARIK_MISTRAL_VISION", "mistral-medium-latest"), label: "Mistral" },
  ];
  const web: Route[] = [
    { provider: "groq", model: G_WEB(), label: "Groq web search" },
    { provider: "groq", model: env("ARIK_GROQ_WEB_MINI", "groq/compound-mini"), label: "Groq web search" },
  ];
  /* Long documents need a big memory: Gemini first. */
  const longFirst = (r: Route[]) => [...r.filter((x) => x.provider === "gemini"), ...r.filter((x) => x.provider !== "gemini")];
  const chosen = intent === "vision" ? vision : intent === "web" ? [...web, ...deep] : intent === "deep" ? deep : fast;
  return (long && intent !== "web" ? longFirst(chosen) : chosen).filter((r) => KEY[r.provider]());
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } })[];
};

export class NoProviderError extends Error {}

/** Streams a reply. Calls onToken with each piece of text as it arrives, and
 *  resolves with which service answered. Tries the next service when one fails
 *  before sending anything. */
export async function streamReply(
  messages: ChatMessage[],
  opts: { intent: Intent; long: boolean; signal: AbortSignal; onToken: (t: string) => void; onSwitch?: (label: string) => void },
): Promise<{ provider: string; model: string }> {
  const routes = plan(opts.intent, opts.long);
  if (!routes.length) throw new NoProviderError("No AI service is set up yet.");
  const failures: string[] = [];

  for (const route of routes) {
    if (opts.signal.aborted) break;
    const model = route.provider === "openrouter" ? await openRouterFree() : route.model;
    let sent = false;
    try {
      const res = await fetch(`${BASE[route.provider]}/chat/completions`, {
        method: "POST",
        signal: AbortSignal.any([opts.signal, AbortSignal.timeout(90_000)]),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${KEY[route.provider]()}`,
          ...(route.provider === "openrouter" ? { "HTTP-Referer": "https://mojatechelectrical.com", "X-Title": "MOJATECH Admin" } : {}),
        },
        body: JSON.stringify({ model, messages, stream: true, temperature: 0.6, max_tokens: 4096, ...route.extra }),
      });
      if (!res.ok || !res.body) {
        failures.push(`${route.label} ${model}: ${res.status} ${(await res.text().catch(() => "")).slice(0, 160)}`);
        continue;
      }
      opts.onSwitch?.(route.label);

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const j = JSON.parse(data);
            if (j.error) throw new Error(typeof j.error === "string" ? j.error : j.error.message || "stream error");
            const t: string | undefined = j.choices?.[0]?.delta?.content;
            if (t) { sent = true; opts.onToken(t); }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
      if (!sent) { failures.push(`${route.label} ${model}: empty reply`); continue; }
      return { provider: route.label, model };
    } catch (e) {
      if (opts.signal.aborted) break;
      failures.push(`${route.label} ${model}: ${e instanceof Error ? e.message : "failed"}`);
      /* Part of an answer already shown: do not start again elsewhere. */
      if (sent) return { provider: route.label, model };
    }
  }
  if (opts.signal.aborted) return { provider: "stopped", model: "" };
  console.error("Arik: every service failed", failures);
  throw new Error("Every AI service is busy right now. Try again in a minute.");
}

/** One short, non-streamed answer (used for chat titles and similar small jobs). */
export async function quickReply(prompt: string): Promise<string | null> {
  let out = "";
  try {
    await streamReply([{ role: "user", content: prompt }], { intent: "fast", long: false, signal: AbortSignal.timeout(15000), onToken: (t) => { out += t; } });
    return out.trim() || null;
  } catch {
    return null;
  }
}
