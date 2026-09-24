"use client";
import { useEffect, useRef, useState } from "react";

const ROBOT = (
  <svg className="lamp" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="rb1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f4f6fd"/><stop offset=".5" stopColor="#c9d0e4"/><stop offset="1" stopColor="#8e97b5"/></linearGradient><linearGradient id="rb2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3a44a8"/><stop offset="1" stopColor="#1b2160"/></linearGradient><radialGradient id="rb3" cx="50%" cy="45%" r="50%"><stop offset="0" stopColor="#fff6d4"/><stop offset=".5" stopColor="#ffcf74"/><stop offset="1" stopColor="#ffae35" stopOpacity="0"/></radialGradient><linearGradient id="rb4" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".9"/><stop offset=".6" stopColor="#fff" stopOpacity=".08"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient></defs><circle className="halo" cx="47" cy="19" r="16" fill="url(#rb3)"/><path d="M36 44c0-4 2-7 4-9l5-6" fill="none" stroke="#aab2cb" strokeWidth="5" strokeLinecap="round"/><path d="M36 44c0-4 2-7 4-9l5-6" fill="none" stroke="url(#rb4)" strokeWidth="2" strokeLinecap="round"/><g className="fil"><path d="M47 9a7.5 7.5 0 0 0-4.3 13.6c.8.6 1.3 1.6 1.3 2.6v.6h6v-.6c0-1 .5-2 1.3-2.6A7.5 7.5 0 0 0 47 9z" fill="url(#rb3)" stroke="#ffe9ae" strokeWidth=".9"/><path d="M44.6 19.5V15l1.2-1.5 1.2 1.5 1.2-1.5 1.2 1.5v4.5" fill="none" stroke="#fff6cf" strokeWidth="1.1" strokeLinejoin="round"/><rect x="44" y="25.4" width="6" height="2.2" rx="1" fill="#b9c0d4"/></g><rect x="13" y="38" width="24" height="18" rx="8" fill="url(#rb1)"/><rect x="13" y="38" width="24" height="18" rx="8" fill="url(#rb4)"/><circle cx="25" cy="47" r="3.4" fill="#2a3291"/><circle cx="25" cy="47" r="1.6" fill="#8c97ff"/><rect x="11" y="18" width="28" height="22" rx="9" fill="url(#rb1)"/><rect x="11" y="18" width="28" height="22" rx="9" fill="url(#rb4)"/><rect x="14.5" y="23" width="21" height="12" rx="6" fill="url(#rb2)"/><circle cx="21" cy="29" r="2.4" fill="#9fe8ff"/><circle cx="29" cy="29" r="2.4" fill="#9fe8ff"/><circle cx="21" cy="29" r="1" fill="#fff"/><circle cx="29" cy="29" r="1" fill="#fff"/><rect x="8" y="26" width="3.5" height="7" rx="1.7" fill="#aab2cb"/><rect x="38.5" y="26" width="3.5" height="7" rx="1.7" fill="#aab2cb"/><path d="M25 18v-4" stroke="#aab2cb" strokeWidth="2" strokeLinecap="round"/><circle cx="25" cy="12" r="2.2" fill="#e0262b"/><ellipse cx="25" cy="58" rx="13" ry="2" fill="#0b1238" opacity=".18"/></svg>
);
const STARTERS = ["What does MOJATECH do?", "I want solar for my home", "My breaker keeps tripping", "How do I apply for NYSC placement?"];

type Link = { href: string; label: string };
type Reply = { text: string; links?: Link[]; hit?: boolean };
type Brain = {
  answer: (q: string) => Reply;
  leadReply: (q: string) => Reply | null;
  wantsQuote: (q: string) => boolean;
  newQuestion: (q: string) => boolean;
  state: { on: boolean; step: number; service: string };
};
type Msg = { who: "a" | "u"; text: string; links?: Link[] };

export default function Arik() {
  const [open, setOpen] = useState(false);
  const [tips, setTips] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const brain = useRef<Brain | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const load = async () => {
    if (!brain.current) {
      const { createArik } = await import("@/lib/arik-brain");
      brain.current = createArik();
    }
  };
  useEffect(() => { document.documentElement.classList.toggle("arik-open", open); }, [open]);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [msgs, busy, tips]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const openPanel = async () => {
    await load();
    setOpen(true);
    if (!msgs.length)
      setMsgs([{ who: "a", text: "Hi, I am ARIK AI, MOJATECH's assistant. Ask me about wiring, solar and inverters, CCTV, our projects, careers, or describe the electrical problem you are having." }]);
    setTimeout(() => inputRef.current?.focus(), 320);
  };

  const sendText = (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;
    setTips(false);
    setMsgs((m) => [...m, { who: "u", text }]);
    setBusy(true);
    const b = brain.current as Brain;
    window.setTimeout(() => {
      let resume = "";
      /* Only a real question interrupts the quote conversation; a short answer is taken as an answer. */
      if (b.state.on && text.includes("?")) {
        resume = b.state.step === 1 ? "\n\nBack to your quote: tell me in one line what you need done."
          : b.state.step === 2 ? "\n\nBack to your quote: which area is the building in?"
          : "\n\nBack to your quote: what number should we call or WhatsApp you on?";
      }
      let r = b.state.on && !resume ? b.leadReply(text) : null;
      if (!r) {
        r = b.answer(text);
        if (!b.state.on && b.wantsQuote(text) && r.hit) {
          /* What they just asked for is the job; start from the area instead of asking twice. */
          b.state.on = true; b.state.step = 2; b.state.service = text;
          r = { text: r.text + "\n\nShall we get it moving? Which area is the building in?", links: [] };
        }
        if (!r.hit) {
          try {
            const miss = JSON.parse(localStorage.getItem("arik-missed") || "[]");
            miss.push({ q: text, at: Date.now() });
            localStorage.setItem("arik-missed", JSON.stringify(miss.slice(-50)));
          } catch {}
        }
      }
      setMsgs((m) => [...m, { who: "a", text: r.text + resume, links: r.links }]);
      setBusy(false);
    }, Math.min(900, 340 + text.length * 8));
  };

  return (
    <>
      <button className="arik-btn" type="button" aria-haspopup="dialog"
        aria-label="Ask ARIK AI, the MOJATECH assistant" onClick={openPanel}>
        {ROBOT}
        <span className="say"><b>Ask ARIK AI</b><span>MOJATECH assistant</span></span>
      </button>

      <section className="arik" role="dialog" aria-label="ARIK AI, the MOJATECH assistant">
        <header className="arik-head">
          {ROBOT}
          <div><b>ARIK AI</b><span className="live">MOJATECH assistant</span></div>
          <button className="arik-x" type="button" aria-label="Close ARIK AI" onClick={() => setOpen(false)}>&#10005;</button>
        </header>

        <div className="arik-log" aria-live="polite" ref={logRef}>
          {msgs.map((m, i) => (
            <div key={i} className={"msg " + m.who}>
              {m.text}
              {m.links && m.links.length > 0 && (
                <div className="msg-links">
                  {m.links.map((l) => (
                    <a key={l.href + l.label} href={l.href}
                      target={/^https?:|^tel:|^mailto:/.test(l.href) ? "_blank" : undefined}
                      rel={/^https?:/.test(l.href) ? "noopener noreferrer" : undefined}
                      onClick={() => { if (!/^https?:|^tel:|^mailto:/.test(l.href)) setTimeout(() => setOpen(false), 180); }}>
                      {l.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          {busy && <div className="msg a"><span className="dots"><span /><span /><span /></span></div>}
        </div>

        <div className={"arik-sugg" + (tips ? " show" : "")}>
          {STARTERS.map((t) => <button key={t} type="button" onClick={() => sendText(t)}>{t}</button>)}
        </div>

        <div className="arik-foot">
          <form className="arik-form" onSubmit={(e) => { e.preventDefault(); const v = inputRef.current?.value || ""; if (inputRef.current) { inputRef.current.value = ""; inputRef.current.style.height = "auto"; } sendText(v); }}>
            <textarea ref={inputRef} rows={1} placeholder="Ask ARIK AI anything…" aria-label="Your message"
              onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = Math.min(96, t.scrollHeight) + "px"; }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); const v = e.currentTarget.value; e.currentTarget.value = ""; e.currentTarget.style.height = "auto"; sendText(v); } }} />
            <button className="arik-send" type="submit" aria-label="Send" disabled={busy}>&#8593;</button>
          </form>
          <button className="arik-tips" type="button" aria-expanded={tips} onClick={() => setTips(!tips)}>Suggested questions</button>
          <div className="arik-human">
            <a href="https://wa.me/2348161683153" target="_blank" rel="noopener noreferrer">WhatsApp a human</a>
            <a href="tel:+2348161683153">Call 0816 168 3153</a>
          </div>
          <p className="arik-note">ARIK AI answers from MOJATECH&apos;s own information. For anything else, a person is on WhatsApp.</p>
        </div>
      </section>
    </>
  );
}
