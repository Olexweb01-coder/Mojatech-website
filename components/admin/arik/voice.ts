"use client";

/* Microphone and speaker helpers for Arik.
 *
 * Recording stops on its own after a short pause in speech (or when tapped),
 * then the audio is written out by the server. Playback reuses one audio
 * element that was "unlocked" by a tap, which is what lets iPhones play replies
 * without a tap each time. */

export type Recorder = { stop: () => void; cancel: () => void; level: () => number };

const pickType = () => ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"].find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) || "";

/** autoStop: "voice" stops after a short pause (conversation), "dictate" after a longer one
 *  (so thinking mid-sentence does not cut you off), false only when tapped. */
export async function record(opts: { autoStop: "voice" | "dictate" | false; onDone: (blob: Blob | null) => void; maxMs?: number }): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
  const type = pickType();
  const rec = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 64_000 } : { audioBitsPerSecond: 64_000 });
  const chunks: Blob[] = [];
  let cancelled = false;

  const ctx = new AudioContext();
  const src = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  src.connect(analyser);
  const data = new Uint8Array(analyser.fftSize);
  let current = 0;

  /* Listens to the room for a moment first, so speech is told apart from
     background noise (a generator, a fan, traffic) wherever you are. */
  const started = performance.now();
  let floor = 0.01, calibrating = true, samples = 0;
  let lastVoice = started, heard = false, raf = 0;
  const pause = opts.autoStop === "voice" ? 1700 : 2200;
  const loop = () => {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (const v of data) { const x = (v - 128) / 128; sum += x * x; }
    current = Math.sqrt(sum / data.length);
    const now = performance.now();
    if (calibrating) {
      floor = (floor * samples + current) / (samples + 1); samples++;
      if (now - started > 350) calibrating = false;
    } else {
      const threshold = Math.max(0.022, floor * 2.6);
      if (current > threshold) { lastVoice = now; heard = true; }
      if (opts.autoStop && heard && now - lastVoice > pause) return finish();
      if (opts.autoStop && !heard && now - started > 10_000) return finish();      /* nobody spoke */
    }
    if (now - started > (opts.maxMs || 90_000)) return finish();
    raf = requestAnimationFrame(loop);
  };

  const cleanup = () => { cancelAnimationFrame(raf); stream.getTracks().forEach((t) => t.stop()); void ctx.close().catch(() => {}); };
  const finish = () => { if (rec.state !== "inactive") rec.stop(); };

  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  rec.onstop = () => {
    cleanup();
    if (cancelled || (!heard && opts.autoStop)) return opts.onDone(null);
    opts.onDone(new Blob(chunks, { type: rec.mimeType || type || "audio/webm" }));
  };
  rec.start(250);
  raf = requestAnimationFrame(loop);
  return { stop: finish, cancel: () => { cancelled = true; finish(); }, level: () => current };
}

export async function transcribe(blob: Blob): Promise<string> {
  const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
  const form = new FormData();
  form.append("audio", blob, `voice.${ext}`);
  const res = await fetch("/admin/api/arik/transcribe", { method: "POST", body: form });
  const j = await res.json().catch(() => ({}));
  if (res.status === 503 && j.error === "no-groq") throw new Error("no-groq");
  if (!res.ok) throw new Error(j.error || "Could not understand that.");
  return j.text || "";
}

/* ---------- Speaking ---------- */

let player: HTMLAudioElement | null = null;
let currentUrl = "";

/** Call from a tap: prepares audio playback for later, async replies. */
export function unlockAudio() {
  if (!player) { player = new Audio(); player.preload = "auto"; }
  try {
    player.src = "data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==";
    void player.play().then(() => player?.pause()).catch(() => {});
  } catch { /* ignore */ }
  speechSynthesis?.getVoices();
}

export function stopSpeaking() {
  try { player?.pause(); } catch {}
  try { speechSynthesis.cancel(); } catch {}
}

function deviceVoice(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof speechSynthesis === "undefined") return resolve();
    const u = new SpeechSynthesisUtterance(text.slice(0, 1200));
    const voices = speechSynthesis.getVoices();
    u.voice = voices.find((v) => /en-NG/i.test(v.lang)) || voices.find((v) => /en-GB/i.test(v.lang) && /natural|google|female/i.test(v.name))
      || voices.find((v) => /^en/i.test(v.lang) && /natural|google/i.test(v.name)) || voices.find((v) => /^en/i.test(v.lang)) || null;
    u.rate = 1.02;
    u.onend = () => resolve(); u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

/** Rewrites what reads well on screen into what sounds right out loud:
 *  "₦1,250,000" becomes "1,250,000 naira", "5kVA" becomes "5 K V A". */
export function forSpeech(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, " ").replace(/\|/g, ", ").replace(/[*_#>`]/g, "").replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/₦\s?([\d,.]+)(\s?(k|m|million|thousand))?/gi, (_m, n, unit) => `${n}${unit ? ` ${unit.toLowerCase() === "k" ? "thousand" : unit.toLowerCase() === "m" ? "million" : unit.trim()}` : ""} naira`)
    .replace(/(\d)\s?kVA\b/gi, "$1 K V A").replace(/(\d)\s?kWh\b/gi, "$1 kilowatt hours").replace(/(\d)\s?kW\b/gi, "$1 kilowatts")
    .replace(/(\d)\s?Ah\b/g, "$1 amp hours").replace(/(\d)\s?W\b/g, "$1 watts").replace(/(\d)\s?V\b/g, "$1 volts")
    .replace(/\bCCTV\b/g, "C C T V").replace(/\bMOJATECH\b/gi, "Moja-tech").replace(/\be\.g\./gi, "for example")
    .replace(/\s+/g, " ").trim();
}

/** Speaks text in the natural voice, or the phone's voice if that is unavailable.
 *  Resolves when speaking ends. */
export async function speak(text: string, signal?: AbortSignal): Promise<void> {
  stopSpeaking();
  const plain = forSpeech(text);
  if (!plain) return;
  try {
    const res = await fetch("/admin/api/arik/speak", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: plain }), signal });
    if (!res.ok) throw new Error("device");
    const blob = await res.blob();
    if (signal?.aborted) return;
    if (!player) player = new Audio();
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    currentUrl = URL.createObjectURL(blob);
    player.src = currentUrl;
    await new Promise<void>((resolve) => {
      const done = () => { player?.removeEventListener("ended", done); player?.removeEventListener("error", done); resolve(); };
      player!.addEventListener("ended", done);
      player!.addEventListener("error", done);
      signal?.addEventListener("abort", () => { player?.pause(); done(); });
      player!.play().catch(() => done());
    });
  } catch {
    if (signal?.aborted) return;
    await deviceVoice(plain);
  }
}

/** The phone's own speech recognition, when the server cannot write out audio. */
export function browserRecognition(onText: (t: string) => void, onEnd: () => void) {
  const W = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  const Ctor = W.SpeechRecognition || W.webkitSpeechRecognition;
  if (!Ctor) return null;
  const r = new Ctor();
  r.lang = "en-NG";
  r.interimResults = false;
  r.continuous = false;
  r.onresult = (e) => onText(Array.from(e.results).map((x) => x[0].transcript).join(" "));
  r.onend = onEnd;
  r.onerror = onEnd;
  r.start();
  return r;
}

type SpeechRecognitionLike = {
  lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; onerror: () => void;
};
