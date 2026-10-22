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
type Msg = { key: string; role: "user" | "assistant"; content: string; files?: FileChip[]; via?: string; error?: string; streaming?: boolean; status?: string; author?: string; authorName?: string };
type ChatItem = { id: string; title: string; updatedAt: string; author: string; authorName: string; pinned: boolean; projectId: string | null };
type Project = { id: string; name: string; pinned: boolean; createdBy: string; count: number };
type Mode = "auto" | "fast" | "deep" | "web" | "image" | "doc";

const MODES: [Mode, string, string][] = [
  ["auto", "Auto", "Picks the best brain for each question"],
  ["fast", "Fast", "Quickest replies"],
  ["deep", "Deep", "Longer, more careful work"],
  ["web", "Web search", "Searches the internet for current information"],
  ["image", "Picture", "Creates a picture, or edits a photo you share"],
  ["doc", "Quotation", "Quotations, invoices, pro-formas and receipts as PDF and Word"],
];

let seq = 0;
const history_ = typeof window === "undefined" ? (null as unknown as History) : window.history;
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

export default function ArikChat({ name, firstName, suggestions, ready }:
  { name: string; firstName: string; suggestions: string[]; ready: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<FileChip[]>([]);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>("auto");
  const [recording, setRecording] = useState<"off" | "dictate">("off");
  const [transcribing, setTranscribing] = useState(false);
  const [chats, setChats] = useState<ChatItem[] | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [meKey, setMeKey] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [editChat, setEditChat] = useState<ChatItem | null>(null);
  const [editProject, setEditProject] = useState<Project | "new" | null>(null);
  const chatDialog = useRef<HTMLDialogElement>(null);
  const projectDialog = useRef<HTMLDialogElement>(null);
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

  const applyList = (r: { chats?: ChatItem[]; projects?: Project[]; me?: string; owner?: boolean } | null) => {
    if (!r?.chats) return;
    setChats(r.chats); setProjects(r.projects || []); setMeKey(r.me || ""); setIsOwner(Boolean(r.owner));
  };
  const loadChats = useCallback(async () => {
    applyList(await fetch("/admin/api/arik/chats").then((x) => x.json()).catch(() => null));
  }, []);

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
      ...(opts.retry ? [] : [{ key: key(), role: "user" as const, content: q.trim(), files: ready, author: meKey }]),
      { key: replyKey, role: "assistant" as const, content: "", streaming: true },
    ]);
    if (!opts.retry) { setText(""); setFiles([]); }
    setBusy(true);
    let answer = "";
    const patch = (p: Partial<Msg>) => setMsgs((m) => m.map((x) => (x.key === replyKey ? { ...x, ...p } : x)));
    try {
      const res = await fetch("/admin/api/arik/chat", {
        method: "POST", signal: ac.signal, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, projectId: chatId ? undefined : activeProject, text: q.trim(), fileIds: ready.map((f) => f.id), mode, voice: opts.voice, retry: opts.retry }),
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
          let ev: { t?: string; chatId?: string; via?: string; error?: string; done?: boolean; provider?: string; status?: string; image?: { id: string; name: string }; doc?: { id: string; name: string } };
          try { ev = JSON.parse(line); } catch { continue; }
          if (ev.chatId) setChatId(ev.chatId);
          if (ev.via) patch({ via: ev.via });
          if (ev.status) patch({ status: ev.status });
          if (ev.doc) { const d = ev.doc; patch({ files: [{ key: key(), id: d.id, name: d.name, kind: "doc" }], status: "" }); }
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
      void loadChats();         /* the new or updated chat moves to the top of the list */
    }
    return answer;
  }, [chatId, files, mode, loadChats, activeProject, meKey]);

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

  const openHistory = () => { history.current?.showModal(); void loadChats(); };

  const openChat = useCallback(async (id: string) => {
    history.current?.close();
    abort.current?.abort();
    const r = await fetch(`/admin/api/arik/chats/${id}`).then((x) => x.json()).catch(() => null);
    if (!r?.messages) { flash("That chat could not be opened. It may have been deleted."); return; }
    setChatId(id);
    setMsgs(r.messages.map((m: { role: "user" | "assistant"; content: string; files: { id: string; name: string; kind: "image" | "doc" }[]; meta: { provider?: string; author?: string; authorName?: string } }) => ({
      key: key(), role: m.role, content: m.content, via: m.meta?.provider,
      author: m.meta?.author || r.chat?.author, authorName: m.meta?.authorName,
      files: m.files?.map((f) => ({ ...f, key: key(), preview: f.kind === "image" ? `/admin/api/arik/files/${f.id}` : undefined })),
    })));
    stick.current = true;
    requestAnimationFrame(() => bottom.current?.scrollIntoView({ block: "end" }));
  }, []);

  /* Like ChatGPT: the list of chats is always there, the open chat is in the
     address (so a reload, or the back button, brings it back), and a new chat
     starts empty. */
  useEffect(() => {
    fetch("/admin/api/arik/chats").then((x) => x.json()).then(applyList).catch(() => {});
    const c = new URLSearchParams(location.search).get("c");
    if (c && /^\d+$/.test(c)) void Promise.resolve().then(() => openChat(c));
  }, [openChat]);
  useEffect(() => {
    const want = chatId ? `/admin?c=${chatId}` : "/admin";
    if (location.pathname + location.search !== want) history_.replaceState(history_.state, "", want);
  }, [chatId]);

  const newChat = () => { abort.current?.abort(); setChatId(null); setMsgs([]); setText(""); setFiles([]); history.current?.close(); input.current?.focus(); };
  const removeChat = async (id: string) => {
    const res = await fetch(`/admin/api/arik/chats/${id}`, { method: "DELETE" }).catch(() => null);
    const j = await res?.json().catch(() => ({}));
    if (!res?.ok) { flash(j?.error || "Could not delete that chat."); return; }
    setChats((c) => c?.filter((x) => x.id !== id) || null);
    chatDialog.current?.close();
    flash("Chat deleted.");
    if (id === chatId) newChat();
  };

  /* Pin, rename, or move a chat into a project. */
  const saveChat = async (id: string, patch: { title?: string; pinned?: boolean; projectId?: string | null }) => {
    const res = await fetch(`/admin/api/arik/chats/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }).catch(() => null);
    if (!res?.ok) { flash("Could not save that change."); return; }
    await loadChats();
  };
  const optionsFor = (c: ChatItem) => { setEditChat(c); chatDialog.current?.showModal(); };

  const saveProject = async (name: string, pinned: boolean) => {
    if (!name.trim()) return;
    if (editProject === "new") {
      const res = await fetch("/admin/api/arik/chats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) }).catch(() => null);
      const j = await res?.json().catch(() => ({}));
      if (!res?.ok) { flash(j?.error || "Could not create the project."); return; }
      setActiveProject(j.id);
      if (editChat) await saveChat(editChat.id, { projectId: j.id });
    } else if (editProject) {
      await fetch(`/admin/api/arik/projects/${editProject.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, pinned }) }).catch(() => null);
    }
    projectDialog.current?.close();
    await loadChats();
  };
  const removeProject = async (p: Project) => {
    const res = await fetch(`/admin/api/arik/projects/${p.id}`, { method: "DELETE" }).catch(() => null);
    const j = await res?.json().catch(() => ({}));
    if (!res?.ok) { flash(j?.error || "Could not remove the project."); return; }
    projectDialog.current?.close();
    if (activeProject === p.id) setActiveProject(null);
    flash("Project removed. Its chats are kept.");
    await loadChats();
  };

  /* Any reply as a branded PDF or Word document. */
  const exportAs = async (content: string, format: "pdf" | "docx") => {
    flash(format === "pdf" ? "Making the PDF…" : "Making the Word file…");
    try {
      const res = await fetch("/admin/api/arik/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: content, format }) });
      if (!res.ok) throw new Error();
      const name = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") || "")?.[1] || `MOJATECH.${format}`;
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      flash("Saved to your downloads.");
    } catch { flash("Could not make the document. Try again."); }
  };

  /* Send a quotation straight to WhatsApp, email and so on, from the phone's share sheet. */
  const shareFile = async (href: string, name: string) => {
    try {
      const blob = await fetch(href).then((r) => { if (!r.ok) throw new Error(); return r.blob(); });
      const file = new File([blob], `${name.split(" · ")[0].replace(/[^\w .()-]+/g, "")}.pdf`, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: name });
      else { const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = file.name; a.click(); flash("This device cannot share files, so it was downloaded instead."); }
    } catch { /* closed the share sheet */ }
  };

  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); flash("Copied."); } catch { flash("Could not copy."); } };

  /* Chats grouped like ChatGPT: Today, Yesterday, Previous 7 days, Older. */
  const groupOf = (iso: string) => {
    const day = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(d);
    const t = day(new Date()), y = day(new Date(Date.now() - 86400_000)), d = day(new Date(iso));
    if (d === t) return "Today";
    if (d === y) return "Yesterday";
    return Date.now() - new Date(iso).getTime() < 7 * 86400_000 ? "Previous 7 days" : "Older";
  };
  const who = (c: { author: string; authorName: string }) => (c.author === meKey ? "You" : c.authorName || "Someone");
  const projectName = (id: string | null) => projects.find((p) => p.id === id)?.name;

  const row = (c: ChatItem, opts: { compact?: boolean } = {}) => (
    <li key={c.id} className={c.id === chatId ? "on" : ""}>
      <div className="mjr-chatrow">
        <button type="button" onClick={() => openChat(c.id)} aria-current={c.id === chatId ? "true" : undefined}>
          <b>{c.pinned && <span className="mjr-pin" aria-label="Pinned">📌 </span>}{c.title}</b>
          <small>{who(c)}{opts.compact ? ` · ${groupOf(c.updatedAt)}` : ""}{!activeProject && c.projectId && projectName(c.projectId) ? ` · ${projectName(c.projectId)}` : ""}</small>
        </button>
        {!opts.compact && (
          <button type="button" className="mjr-more" onClick={() => optionsFor(c)} aria-label={`Options for ${c.title}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.7" fill="currentColor" /><circle cx="12" cy="12" r="1.7" fill="currentColor" /><circle cx="19" cy="12" r="1.7" fill="currentColor" /></svg>
          </button>
        )}
      </div>
    </li>
  );

  /* The team's chats: search, pinned, projects, then recent by date. */
  const chatList = (limit?: number) => {
    if (!chats) return <div className="mja-skel"><i /><i /></div>;
    if (limit) {
      const list = chats.slice(0, limit);
      return list.length ? <ul className="mjr-chatlist">{list.map((c) => row(c, { compact: true }))}</ul> : null;
    }
    const q = query.trim().toLowerCase();
    if (q) {
      const found = chats.filter((c) => c.title.toLowerCase().includes(q) || c.authorName.toLowerCase().includes(q));
      return (
        <>
          <span className="mjr-group">{found.length ? `${found.length} found` : "Nothing found"}</span>
          <ul className="mjr-chatlist">{found.map((c) => row(c))}</ul>
        </>
      );
    }
    if (activeProject) {
      const p = projects.find((x) => x.id === activeProject);
      const list = chats.filter((c) => c.projectId === activeProject);
      return (
        <>
          <div className="mjr-projhead">
            <button type="button" className="mjr-back" onClick={() => setActiveProject(null)} aria-label="All chats">‹</button>
            <b>{p?.name || "Project"}</b>
            {p && <button type="button" className="mjr-more" onClick={() => { setEditProject(p); projectDialog.current?.showModal(); }} aria-label="Project options">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.7" fill="currentColor" /><circle cx="12" cy="12" r="1.7" fill="currentColor" /><circle cx="19" cy="12" r="1.7" fill="currentColor" /></svg>
            </button>}
          </div>
          <p className="mja-note mjr-projnote">New chats started here go into this project.</p>
          {list.length ? <ul className="mjr-chatlist">{list.map((c) => row(c))}</ul> : <p className="mja-muted mjr-nochats">No chats in this project yet.</p>}
        </>
      );
    }
    const pinned = chats.filter((c) => c.pinned);
    const recent = chats.filter((c) => !c.pinned && !c.projectId);
    let last = "";
    return (
      <>
        {pinned.length > 0 && (<><span className="mjr-group">Pinned</span><ul className="mjr-chatlist">{pinned.map((c) => row(c))}</ul></>)}
        <div className="mjr-projects">
          <span className="mjr-group">Projects</span>
          <ul className="mjr-chatlist">
            {projects.map((p) => (
              <li key={p.id}>
                <div className="mjr-chatrow">
                  <button type="button" onClick={() => setActiveProject(p.id)}>
                    <b><span className="mjr-folder" aria-hidden="true">▣</span> {p.pinned && "📌 "}{p.name}</b>
                    <small>{p.count} chat{p.count === 1 ? "" : "s"}</small>
                  </button>
                </div>
              </li>
            ))}
            <li><button type="button" className="mjr-newproj" onClick={() => { setEditChat(null); setEditProject("new"); projectDialog.current?.showModal(); }}>+ New project</button></li>
          </ul>
        </div>
        {recent.length > 0 ? recent.map((c) => {
          const g = groupOf(c.updatedAt);
          const head = g !== last ? (last = g) : null;
          return (
            <div key={c.id}>
              {head && <span className="mjr-group">{head}</span>}
              <ul className="mjr-chatlist">{row(c)}</ul>
            </div>
          );
        }) : !pinned.length && <p className="mja-muted mjr-nochats">The team&apos;s conversations will appear here.</p>}
      </>
    );
  };

  const navPanel = (
    <>
      <button type="button" className="mja-btn red sm mjr-newbtn" onClick={newChat}><Icon d={I.plus} /> {activeProject ? "New chat in project" : "New chat"}</button>
      <label className="mjr-search"><span className="mja-sr">Search chats</span>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search chats" enterKeyHint="search" />
      </label>
      {chatList()}
    </>
  );

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
    <div className="mjr-wrap">
    <aside className="mjr-side" aria-label="Team chats">
      {navPanel}
    </aside>
    <div className={"mjr" + (msgs.length ? " has-msgs" : "")}>
      <div className="mjr-top">
        <button type="button" className="mja-btn line sm mjr-chatsbtn" onClick={openHistory}><Icon d={I.chats} /> Chats</button>
        <button type="button" className="mja-btn line sm" onClick={newChat} disabled={!msgs.length && !chatId}><Icon d={I.plus} /> New chat</button>
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
          {chats && chats.length > 0 && (
            <div className="mjr-recent">
              <h3>Recent team chats</h3>
              {chatList(4)}
              {chats.length > 4 && <button type="button" className="mja-linkbtn" onClick={openHistory}>All {chats.length} chats</button>}
            </div>
          )}
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
              {m.role === "user" && m.author && meKey && m.author !== meKey && <span className="mjr-author">{m.authorName || "Someone"}</span>}
              {m.role === "user" ? (m.content && <p className={"mjr-bubble" + (m.author && meKey && m.author !== meKey ? " other" : "")}>{m.content}</p>) : (
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
                  {m.files?.filter((f) => f.kind === "doc" && f.id).map((f) => (
                    <div key={f.key} className="mjr-doccard">
                      <span className="mjr-doccard-icon" aria-hidden="true"><Icon d={I.doc} /></span>
                      <span className="mjr-doccard-name">{f.name}</span>
                      <span className="mjr-doccard-actions">
                        <a className="mja-btn red sm" href={`/admin/api/arik/files/${f.id}?format=pdf`} download>PDF</a>
                        <a className="mja-btn line sm" href={`/admin/api/arik/files/${f.id}?format=docx`} download>Word</a>
                        <button type="button" className="mja-btn line sm" onClick={() => shareFile(`/admin/api/arik/files/${f.id}?format=pdf`, f.name)}>Share</button>
                      </span>
                    </div>
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
                      {!m.files?.some((f) => f.kind === "doc") && (
                        <>
                          <button type="button" className="mjr-fmt" onClick={() => exportAs(m.content, "pdf")} aria-label="Save as PDF">PDF</button>
                          <button type="button" className="mjr-fmt" onClick={() => exportAs(m.content, "docx")} aria-label="Save as Word">Word</button>
                        </>
                      )}
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
          <h3 id="chats-title" className="mja-h3">Team chats</h3>
          <button type="button" className="mja-menu" onClick={() => history.current?.close()} aria-label="Close"><Icon d={I.close} /></button>
        </div>
        {navPanel}
      </dialog>

      <dialog ref={chatDialog} className="mja-dialog small" aria-labelledby="chat-opt-title">
        {editChat && (
          <form key={editChat.id} className="mja-dialog-form" onSubmit={async (e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget);
            await saveChat(editChat.id, { title: String(d.get("title") || ""), pinned: d.get("pinned") === "on", projectId: String(d.get("project") || "") || null });
            chatDialog.current?.close(); flash("Saved.");
          }}>
            <h3 id="chat-opt-title" className="mja-h3">Chat</h3>
            <p className="mja-note">Started by {who(editChat)}. Everyone on the team can see it.</p>
            <div className="mja-field"><label htmlFor="co-title">Name</label><input id="co-title" name="title" defaultValue={editChat.title} maxLength={80} required /></div>
            <div className="mja-field"><label htmlFor="co-proj">Project</label>
              <select id="co-proj" name="project" defaultValue={editChat.projectId || ""}>
                <option value="">No project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <button type="button" className="mja-linkbtn" onClick={() => { chatDialog.current?.close(); setEditProject("new"); projectDialog.current?.showModal(); }}>+ New project for this chat</button>
            <label className="mja-toggle"><span><b>Pin to the top</b><small>Pinned chats stay at the top for everyone.</small></span>
              <span className="mja-switch"><input type="checkbox" role="switch" name="pinned" defaultChecked={editChat.pinned} /><span aria-hidden="true" /></span></label>
            <div className="mja-dialog-actions">
              {(editChat.author === meKey || isOwner) && <button type="button" className="mja-btn line danger mjs-del" onClick={() => removeChat(editChat.id)}>Delete</button>}
              <button type="button" className="mja-btn line" onClick={() => chatDialog.current?.close()}>Cancel</button>
              <button type="submit" className="mja-btn red">Save</button>
            </div>
          </form>
        )}
      </dialog>

      <dialog ref={projectDialog} className="mja-dialog small" aria-labelledby="proj-title">
        {editProject && (
          <form key={editProject === "new" ? "new" : editProject.id} className="mja-dialog-form" onSubmit={(e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget);
            void saveProject(String(d.get("name") || ""), d.get("pinned") === "on");
          }}>
            <h3 id="proj-title" className="mja-h3">{editProject === "new" ? "New project" : "Project"}</h3>
            <p className="mja-note">A project keeps related chats together, for example one customer, one site, or one tender.</p>
            <div className="mja-field"><label htmlFor="pj-name">Name</label><input id="pj-name" name="name" required maxLength={60} defaultValue={editProject === "new" ? "" : editProject.name} placeholder="e.g. Lekki duplex solar, FIRS tender" /></div>
            {editProject !== "new" && (
              <label className="mja-toggle"><span><b>Pin to the top</b><small>Pinned projects are listed first.</small></span>
                <span className="mja-switch"><input type="checkbox" role="switch" name="pinned" defaultChecked={editProject.pinned} /><span aria-hidden="true" /></span></label>
            )}
            <div className="mja-dialog-actions">
              {editProject !== "new" && (editProject.createdBy === meKey || isOwner) && <button type="button" className="mja-btn line danger mjs-del" onClick={() => removeProject(editProject)}>Remove</button>}
              <button type="button" className="mja-btn line" onClick={() => projectDialog.current?.close()}>Cancel</button>
              <button type="submit" className="mja-btn red">{editProject === "new" ? "Create" : "Save"}</button>
            </div>
          </form>
        )}
      </dialog>
    </div>
    </div>
  );
}
