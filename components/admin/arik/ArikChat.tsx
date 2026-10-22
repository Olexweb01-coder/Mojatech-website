"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "./Markdown";
import { shrink } from "@/lib/client/photo";
import { record, transcribe, speak, stopSpeaking, unlockAudio, browserRecognition, type Recorder } from "./voice";

/* Arik: the assistant the admin opens on.
 *
 * Type, talk or share files. Replies stream in as they are written. Each person's
 * conversations are kept privately and can be reopened from "Chats". Voice mode
 * is hands-free: speak, Arik answers out loud, then listens again. */

type FileChip = { id?: string; name: string; kind: "image" | "doc"; preview?: string; uploading?: boolean; key: string; chars?: number };
type Msg = { key: string; role: "user" | "assistant"; content: string; files?: FileChip[]; via?: string; error?: string; streaming?: boolean; status?: string };
type ChatItem = { id: string; title: string; updatedAt: string };
type Mode = "auto" | "fast" | "deep" | "web" | "image";

const MODES: [Mode, string, string][] = [
  ["auto", "Auto", "Picks the best brain for each question"],
  ["fast", "Fast", "Quickest replies"],
  ["deep", "Deep", "Longer, more careful work"],
  ["web", "Web search", "Searches the internet for current information"],
  ["image", "Picture", "Creates a picture, or edits a photo you share"],
];

let seq = 0;
const key = () => `k${++seq}`;

function Icon({ d, fill }: { d: string; fill?: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} fill={fill ? "currentColor" : "none"} stroke={fill ? "none" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
const I = {
  send: "M5 12h13M12 5l7 7-7 7",
  stop: "M7 7h10v10H7z",
  mic: "M12 4a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V7a3 3 0 0 1 3-3zM6 11.5a6 6 0 0 0 12 0M12 17.5V20",
  clip: "M15.5 7.5 9 14a2.1 2.1 0 0 0 3 3l7-7a4.2 4.2 0 0 0-6-6l-7.2 7.2a6.3 6.3 0 0 0 9 9L20 15",
  copy: "M9 9h10v10H9zM5 15V5h10",
  speaker: "M5 9.5h3l4-3.5v12l-4-3.5H5zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11",
  retry: "M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v3.7h3.7",
  plus: "M12 5v14M5 12h14",
  chats: "M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A2.5 2.5 0 0 1 4 13.5z",
  wave: "M4 12h1.5M8 8v8M12 5v14M16 8v8M19.5 12H20",
  close: "M6 6l12 12M18 6 6 18",
  doc: "M7 3.5h6.5L18 8v12.5H7zM13 3.5V8h5",
  trash: "M5 7h14M9.5 7V4.5h5V7M7 7l1 13h8l1-13",
};

export default function ArikChat({ name, firstName, suggestions, ready, canRename }:
  { name: string; firstName: string; suggestions: string[]; ready: boolean; canRename: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<FileChip[]>([]);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>("auto");
  const [recording, setRecording] = useState<"off" | "dictate">("off");
  const [transcribing, setTranscribing] = useState(false);
  const [chats, setChats] = useState<ChatItem[] | null>(null);
  const [voice, setVoice] = useState<"off" | "listening" | "thinking" | "speaking">("off");
  const [level, setLevel] = useState(0);
  const [notice, setNotice] = useState("");
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);

  const abort = useRef<AbortController | null>(null);
  const rec = useRef<Recorder | null>(null);
  const voiceOn = useRef(false);
  const speakAbort = useRef<AbortController | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const history = useRef<HTMLDialogElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const browserStt = useRef(false);
  const stick = useRef(true);

  const flash = (t: string) => { setNotice(t); window.setTimeout(() => setNotice(""), 5000); };

  /* Keep the newest words in view while a reply streams, unless the person has scrolled up to read. */
  useEffect(() => {
    const onScroll = () => { stick.current = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => { if (stick.current) bottom.current?.scrollIntoView({ block: "end" }); }, [msgs]);

  /* The text box grows with what is typed. */
  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [text]);

  /* ---------- Sending ---------- */

  const ask = useCallback(async (q: string, opts: { voice?: boolean; retry?: boolean } = {}): Promise<string> => {
    const ready = files.filter((f) => f.id && !f.uploading);
    if (!opts.retry && !q.trim() && !ready.length) return "";
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    stick.current = true;
    const replyKey = key();
    setMsgs((m) => [
      ...(opts.retry ? m.slice(0, m.map((x) => x.role).lastIndexOf("assistant")) : m),
      ...(opts.retry ? [] : [{ key: key(), role: "user" as const, content: q.trim(), files: ready }]),
      { key: replyKey, role: "assistant" as const, content: "", streaming: true },
    ]);
    if (!opts.retry) { setText(""); setFiles([]); }
    setBusy(true);
    let answer = "";
    const patch = (p: Partial<Msg>) => setMsgs((m) => m.map((x) => (x.key === replyKey ? { ...x, ...p } : x)));
    try {
      const res = await fetch("/admin/api/arik/chat", {
        method: "POST", signal: ac.signal, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, text: q.trim(), fileIds: ready.map((f) => f.id), mode, voice: opts.voice, retry: opts.retry }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error === "setup" ? "setup" : j.error || "Arik could not answer. Try again.");
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "", pending = "", frame = 0;
      const flush = () => { frame = 0; if (pending) { answer += pending; pending = ""; patch({ content: answer }); } };
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i: number;
        while ((i = buf.indexOf("\n\n")) >= 0) {
          const line = buf.slice(0, i).replace(/^data: /, "");
          buf = buf.slice(i + 2);
          let ev: { t?: string; chatId?: string; via?: string; error?: string; done?: boolean; provider?: string; status?: string; image?: { id: string; name: string } };
          try { ev = JSON.parse(line); } catch { continue; }
          if (ev.chatId) setChatId(ev.chatId);
          if (ev.via) patch({ via: ev.via });
          if (ev.status) patch({ status: ev.status });
          if (ev.image) { const img = ev.image; patch({ files: [{ key: key(), id: img.id, name: img.name, kind: "image", preview: `/admin/api/arik/files/${img.id}` }], status: "" }); }
          if (ev.t) { pending += ev.t; if (!frame) frame = requestAnimationFrame(flush); }
          if (ev.error) patch({ error: ev.error === "setup" ? "setup" : ev.error });
        }
      }
      cancelAnimationFrame(frame); flush();
    } catch (e) {
      if (!ac.signal.aborted) patch({ error: e instanceof Error ? e.message : "Something went wrong." });
    } finally {
      patch({ streaming: false });
      setBusy(false);
      if (abort.current === ac) abort.current = null;
      setChats(null);           /* refresh the list next time it is opened */
    }
    return answer;
  }, [chatId, files, mode]);

  const stop = () => { abort.current?.abort(); };

  const submit = () => { if (!busy && !files.some((f) => f.uploading)) void ask(text); };

  /* ---------- Files ---------- */

  const addFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const picked = Array.from(list).slice(0, 8 - files.length);
    for (const file of picked) {
      const k = key();
      const isImg = file.type.startsWith("image/");
      const preview = isImg ? URL.createObjectURL(file) : undefined;
      setFiles((f) => [...f, { key: k, name: file.name, kind: isImg ? "image" : "doc", preview, uploading: true }]);
      try {
        const form = new FormData();
        if (isImg) {
          const s = await shrink(file);
          form.append("file", s.blob, file.name.replace(/\.\w+$/, "") + (s.type === "image/webp" ? ".webp" : ".jpg"));
        } else form.append("file", file, file.name);
        const res = await fetch("/admin/api/arik/files", { method: "POST", body: form });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error || "Could not read that file.");
        setFiles((f) => f.map((x) => (x.key === k ? { ...x, id: j.id, uploading: false, chars: j.chars } : x)));
      } catch (e) {
        setFiles((f) => f.filter((x) => x.key !== k));
        flash(e instanceof Error ? e.message : "Could not read that file.");
      }
    }
    if (fileInput.current) fileInput.current.value = "";
  };

  /* Paste a screenshot straight into the box. */
  const onPaste = (e: React.ClipboardEvent) => {
    const imgs = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith("image/"));
    if (imgs.length) { e.preventDefault(); const dt = new DataTransfer(); imgs.forEach((f) => dt.items.add(f)); void addFiles(dt.files); }
  };

  /* ---------- Dictation (mic button in the box) ---------- */

  const hear = async (blob: Blob | null): Promise<string> => {
    if (!blob) return "";
    setTranscribing(true);
    try { return await transcribe(blob); }
    catch (e) {
      if (e instanceof Error && e.message === "no-groq") { browserStt.current = true; flash("Add a Groq key for the best voice typing. Using the phone's own for now."); }
      else flash(e instanceof Error ? e.message : "Could not understand that.");
      return "";
    } finally { setTranscribing(false); }
  };

  const dictate = async () => {
    if (recording === "dictate") { rec.current?.stop(); return; }
    if (browserStt.current) {
      const r = browserRecognition((t) => setText((x) => (x ? x + " " : "") + t), () => setRecording("off"));
      if (r) { setRecording("dictate"); return; }
    }
    try {
      setRecording("dictate");
      rec.current = await record({
        autoStop: "dictate", maxMs: 120_000,
        onDone: async (blob) => {
          setRecording("off");
          const t = await hear(blob);
          if (t) { setText((x) => (x ? x + " " : "") + t); input.current?.focus(); }
        },
      });
    } catch {
      setRecording("off");
      flash("Allow the microphone to talk to " + name + ".");
    }
  };

  /* ---------- Voice mode (hands-free conversation) ---------- */

  const listenLoop = useCallback(async () => {
    if (!voiceOn.current) return;
    setVoice("listening");
    try {
      rec.current = await record({
        autoStop: "voice", maxMs: 60_000,
        onDone: async (blob) => {
          if (!voiceOn.current) return;
          if (!blob) { if (voiceOn.current) void listenLoop(); return; }
          setVoice("thinking");
          const q = await hear(blob);
          if (!voiceOn.current) return;
          if (!q) { void listenLoop(); return; }
          const answer = await ask(q, { voice: true });
          if (!voiceOn.current || !answer) { if (voiceOn.current) void listenLoop(); return; }
          setVoice("speaking");
          speakAbort.current = new AbortController();
          await speak(answer, speakAbort.current.signal);
          if (voiceOn.current) void listenLoop();
        },
      });
    } catch {
      flash("Allow the microphone to talk to " + name + ".");
      endVoice();
    }
  }, [ask, name]); // eslint-disable-line react-hooks/exhaustive-deps

  /* The listening ring follows your voice. */
  useEffect(() => {
    if (voice !== "listening") return;
    let raf = 0;
    const tick = () => { setLevel(rec.current?.level() || 0); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [voice]);

  const startVoice = () => {
    unlockAudio();
    voiceOn.current = true;
    void listenLoop();
  };
  const endVoice = () => {
    voiceOn.current = false;
    rec.current?.cancel();
    speakAbort.current?.abort();
    stopSpeaking();
    abort.current?.abort();
    setVoice("off");
  };
  /* While speaking, a tap interrupts and listens again. */
  const interrupt = () => {
    if (voice === "speaking") { speakAbort.current?.abort(); stopSpeaking(); }
    else if (voice === "listening") rec.current?.stop();
  };

  /* ---------- Read one reply aloud ---------- */

  const readAloud = async (m: Msg) => {
    if (speakingKey === m.key) { speakAbort.current?.abort(); stopSpeaking(); setSpeakingKey(null); return; }
    unlockAudio();
    speakAbort.current?.abort();
    speakAbort.current = new AbortController();
    setSpeakingKey(m.key);
    await speak(m.content, speakAbort.current.signal);
    setSpeakingKey((k) => (k === m.key ? null : k));
  };

  /* ---------- Chats ---------- */

  const openHistory = async () => {
    history.current?.showModal();
    if (!chats) {
      const r = await fetch("/admin/api/arik/chats").then((x) => x.json()).catch(() => ({ chats: [] }));
      setChats(r.chats || []);
    }
  };
  const openChat = async (id: string) => {
    history.current?.close();
    abort.current?.abort();
    const r = await fetch(`/admin/api/arik/chats/${id}`).then((x) => x.json()).catch(() => null);
    if (!r?.messages) return flash("Could not open that chat.");
    setChatId(id);
    setMsgs(r.messages.map((m: { role: "user" | "assistant"; content: string; files: { id: string; name: string; kind: "image" | "doc" }[]; meta: { provider?: string } }) => ({
      key: key(), role: m.role, content: m.content, via: m.meta?.provider,
      files: m.files?.map((f) => ({ ...f, key: key(), preview: f.kind === "image" ? `/admin/api/arik/files/${f.id}` : undefined })),
    })));
    window.scrollTo(0, 0);
  };
  const newChat = () => { abort.current?.abort(); setChatId(null); setMsgs([]); setText(""); setFiles([]); history.current?.close(); input.current?.focus(); };
  const removeChat = async (id: string) => {
    await fetch(`/admin/api/arik/chats/${id}`, { method: "DELETE" }).catch(() => {});
    setChats((c) => c?.filter((x) => x.id !== id) || null);
    if (id === chatId) newChat();
  };

  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); flash("Copied."); } catch { flash("Could not copy."); } };

  const lastAssistant = msgs.map((m) => m.role).lastIndexOf("assistant");
  const uploading = files.some((f) => f.uploading);

  if (!ready) {
    return (
      <section className="mjr-setup mja-card">
        <h2 className="mja-h3">{name} needs an AI key to start</h2>
        <p className="mja-muted">Add at least one free key to <b>.env.local</b> on your computer and in <b>Vercel → Settings → Environment Variables</b>, then restart. More keys means fewer limits.</p>
        <ol className="mjr-keys">
          <li><b>GROQ_API_KEY</b>: fast replies, web search and voice typing. Free at console.groq.com/keys</li>
          <li><b>GEMINI_API_KEY</b>: photos and long documents. Free at aistudio.google.com/apikey</li>
          <li><b>MISTRAL_API_KEY</b>: long writing, big monthly allowance. Free “Experiment” plan at console.mistral.ai</li>
          <li><b>OPENROUTER_API_KEY</b>: extra free models, and the natural speaking voice. Free at openrouter.ai/keys</li>
          <li><b>FISH_API_KEY</b> (optional): the natural voice directly. Free at fish.audio/app/api-keys</li>
        </ol>
      </section>
    );
  }

  return (
    <div className={"mjr" + (msgs.length ? " has-msgs" : "")}>
      <div className="mjr-top">
        <button type="button" className="mja-btn line sm" onClick={openHistory}><Icon d={I.chats} /> Chats</button>
        <button type="button" className="mja-btn line sm" onClick={newChat} disabled={!msgs.length}><Icon d={I.plus} /> New</button>
        <label className="mjr-mode">
          <span className="mja-sr">How {name} works</span>
          <select value={mode} onChange={(e) => setMode(e.target.value as Mode)} title={MODES.find((m) => m[0] === mode)?.[2]}>
            {MODES.map(([v, label, hint]) => <option key={v} value={v} title={hint}>{label}</option>)}
          </select>
        </label>
      </div>

      {msgs.length === 0 ? (
        <div className="mjr-hello">
          <span className="mja-arik-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V17h5.2v-1.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3zM10 20.5h4M10.5 9.5l1.5 2 1.5-2" /></svg>
          </span>
          <h2>{firstName ? `Hi ${firstName}.` : "Hello."} I&apos;m {name}.</h2>
          <p>Ask me anything, talk to me, or share a document or photo.</p>
          <div className="mjr-suggest">
            {suggestions.map((s) => <button key={s} type="button" onClick={() => ask(s)}>{s}</button>)}
          </div>
          {canRename && <p className="mja-note">You can rename {name} at the bottom of this page.</p>}
        </div>
      ) : (
        <ol className="mjr-thread" aria-live="polite">
          {msgs.map((m, i) => (
            <li key={m.key} className={`mjr-msg ${m.role}`}>
              {m.role === "user" && m.files && m.files.length > 0 && (
                <div className="mjr-files">
                  {m.files.map((f) => f.kind === "image" && f.preview
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img key={f.key} src={f.preview} alt={f.name} />
                    : <span key={f.key} className="mjr-doc"><Icon d={I.doc} />{f.name}</span>)}
                </div>
              )}
              {m.role === "user" ? (m.content && <p className="mjr-bubble">{m.content}</p>) : (
                <div className="mjr-answer">
                  {m.files?.filter((f) => f.kind === "image" && f.preview).map((f) => (
                    <figure key={f.key} className="mjr-gen">
                      <a href={f.preview} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.preview} alt="Picture made by the assistant" />
                      </a>
                      <figcaption>
                        <a className="mja-btn line sm" href={f.preview} download={f.name}>Download</a>
                        <button type="button" className="mja-btn line sm" onClick={() => { setFiles((x) => [...x.filter((y) => y.id !== f.id), { ...f, key: key() }]); setMode("image"); input.current?.focus(); }}>Edit this</button>
                      </figcaption>
                    </figure>
                  ))}
                  {m.content ? <Markdown text={m.content} /> : m.streaming && !m.error ? (
                    <span className="mjr-thinking"><span className="mjr-typing" aria-label={`${name} is thinking`}><i /><i /><i /></span>{m.status && <em>{m.status}</em>}</span>
                  ) : null}
                  {m.error && (m.error === "setup"
                    ? <p className="mja-bad">No AI key is set up yet. Add one in .env.local and Vercel (see the setup card after a restart).</p>
                    : <p className="mja-bad">{m.error}</p>)}
                  {!m.streaming && m.content && (
                    <div className="mjr-tools">
                      <button type="button" onClick={() => copy(m.content)} aria-label="Copy"><Icon d={I.copy} /></button>
                      <button type="button" onClick={() => readAloud(m)} aria-label={speakingKey === m.key ? "Stop reading" : "Read aloud"} aria-pressed={speakingKey === m.key}><Icon d={speakingKey === m.key ? I.stop : I.speaker} /></button>
                      {i === lastAssistant && !busy && <button type="button" onClick={() => ask("", { retry: true })} aria-label="Try again"><Icon d={I.retry} /></button>}
                      {m.via && <span className="mjr-via">{m.via}</span>}
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
      <div ref={bottom} />

      {notice && <p className="mjr-notice" role="status">{notice}</p>}

      <div className="mjr-composer">
        {files.length > 0 && (
          <div className="mjr-pending" data-noswipe>
            {files.map((f) => (
              <span key={f.key} className={"mjr-chip" + (f.uploading ? " is-up" : "")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {f.preview ? <img src={f.preview} alt="" /> : <Icon d={I.doc} />}
                <span>{f.uploading ? "Reading…" : f.name}</span>
                <button type="button" onClick={() => setFiles((x) => x.filter((y) => y.key !== f.key))} aria-label={`Remove ${f.name}`}><Icon d={I.close} /></button>
              </span>
            ))}
          </div>
        )}
        <div className="mjr-box">
          <button type="button" className="mjr-icon" onClick={() => fileInput.current?.click()} aria-label="Share a file or photo" disabled={files.length >= 8}><Icon d={I.clip} /></button>
          <input ref={fileInput} type="file" hidden multiple
            accept="image/*,.pdf,.docx,.xlsx,.xls,.csv,.txt,.md,.json" onChange={(e) => addFiles(e.target.files)} />
          <textarea ref={input} rows={1} value={text} placeholder={recording === "dictate" ? "Listening… tap the mic when done" : transcribing ? "Writing out what you said…" : mode === "image" ? (files.some((f) => f.kind === "image") ? "Say what to change in the photo" : "Describe the picture you want") : `Message ${name}`}
            onChange={(e) => setText(e.target.value)} onPaste={onPaste}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia("(hover: hover)").matches) { e.preventDefault(); submit(); } }}
            aria-label={`Message ${name}`} enterKeyHint="send" />
          <button type="button" className={"mjr-icon" + (recording === "dictate" ? " is-rec" : "")} onClick={dictate} aria-label={recording === "dictate" ? "Stop and write it out" : "Talk instead of typing"} disabled={transcribing}><Icon d={I.mic} /></button>
          {busy ? (
            <button type="button" className="mjr-send" onClick={stop} aria-label="Stop"><Icon d={I.stop} fill /></button>
          ) : text.trim() || files.some((f) => f.id) ? (
            <button type="button" className="mjr-send" onClick={submit} disabled={uploading} aria-label="Send"><Icon d={I.send} /></button>
          ) : (
            <button type="button" className="mjr-send voice" onClick={startVoice} aria-label={`Talk with ${name} by voice`}><Icon d={I.wave} /></button>
          )}
        </div>
      </div>

      {voice !== "off" && (
        <div className="mjr-voice" role="dialog" aria-modal="true" aria-label={`Voice conversation with ${name}`}>
          <button type="button" className="mjr-orb" data-state={voice} onClick={interrupt}
            style={{ "--lvl": Math.min(1, level * 9) } as React.CSSProperties}
            aria-label={voice === "speaking" ? "Interrupt" : voice === "listening" ? "Done speaking" : "Thinking"}>
            <span />
          </button>
          <p className="mjr-voice-state">{voice === "listening" ? "Listening…" : voice === "thinking" ? "Thinking…" : `${name} is speaking. Tap to interrupt.`}</p>
          <button type="button" className="mja-btn line" onClick={endVoice}>End</button>
        </div>
      )}

      <dialog ref={history} className="mja-dialog mjr-history" aria-labelledby="chats-title">
        <div className="mja-dialog-head">
          <h3 id="chats-title" className="mja-h3">Your chats</h3>
          <button type="button" className="mja-menu" onClick={() => history.current?.close()} aria-label="Close"><Icon d={I.close} /></button>
        </div>
        <button type="button" className="mja-btn red sm" onClick={newChat}><Icon d={I.plus} /> New chat</button>
        {!chats ? <div className="mja-skel"><i /><i /></div> : chats.length === 0 ? <p className="mja-muted">No chats yet.</p> : (
          <ul className="mjr-chatlist">
            {chats.map((c) => (
              <li key={c.id} className={c.id === chatId ? "on" : ""}>
                <button type="button" onClick={() => openChat(c.id)}>
                  <b>{c.title}</b>
                  <small>{new Date(c.updatedAt).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small>
                </button>
                <button type="button" className="mjr-del" onClick={() => removeChat(c.id)} aria-label={`Delete ${c.title}`}><Icon d={I.trash} /></button>
              </li>
            ))}
          </ul>
        )}
      </dialog>
    </div>
  );
}
