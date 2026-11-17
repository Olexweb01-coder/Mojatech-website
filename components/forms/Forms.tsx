"use client";
import { useState } from "react";
import { services } from "@/lib/data/services";
import { company } from "@/lib/data/company";
import { sendEnquiry } from "@/lib/client/enquiry";

/* Each form is saved for the MOJATECH admin the moment it is sent, then opens
   WhatsApp exactly as before. */

/** A field people never see. Only spam bots fill it in. */
function Trap({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
      <label>Leave this empty<input tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} /></label>
    </div>
  );
}

/** When the form appeared, to tell people from bots that fill forms instantly. */
function useOpenedAt() {
  const [at] = useState(() => (typeof performance === "undefined" ? 0 : performance.now()));
  return at;
}

function useSteps(total: number) {
  const [step, setStep] = useState(1);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [unsaved, setUnsaved] = useState(false);   /* the website could not keep its copy */
  return { step, setStep, sent, setSent, total, error, setError, unsaved, setUnsaved };
}
function waLink(lines: string[]) {
  return company.contact.whatsapp + "?text=" + encodeURIComponent(lines.filter(Boolean).join(" "));
}

/** The quote request. It sends to MOJATECH by WhatsApp, so nothing is lost if email is down. */
export function QuoteForm() {
  const s = useSteps(3);
  const [service, setService] = useState("");
  const [kind, setKind] = useState("");
  const [f, setF] = useState({ area: "", details: "", name: "", phone: "", email: "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [trap, setTrap] = useState("");
  const openedAt = useOpenedAt();
  const record = () => sendEnquiry({
    kind: "quote", name: f.name, phone: f.phone, email: f.email, website: trap, openedAt,
    fields: [["Service", service], ["Building", kind], ["Area", f.area], ["Details", f.details]],
  });
  const send = waLink(["Hello MOJATECH, I would like a quote.", service && `Service: ${service}.`, kind && `Building: ${kind}.`,
    f.area && `Area: ${f.area}.`, f.details && `Details: ${f.details}`, f.name && `Name: ${f.name}.`, f.phone && `Phone: ${f.phone}.`, f.email && `Email: ${f.email}.`]);

  return (
    <form className="form" noValidate onSubmit={(e) => e.preventDefault()}>
      <Trap value={trap} onChange={setTrap} />
      {!s.sent && (
        <>
          <div className="steps-bar">{[1, 2, 3].map((n) => <i key={n} className={n <= s.step ? "on" : ""} />)}</div>
          <div className={"fstep" + (s.step === 1 ? " on" : "")} data-step="1">
            <h3>What do you need?</h3>
            <div className="opts">
              {services.map((x) => (
                <button key={x.id} className="opt" type="button" aria-pressed={service === x.name}
                  onClick={() => { setService(x.name); s.setStep(2); }}>{x.name}</button>
              ))}
              <button className="opt" type="button" aria-pressed={service === "Not sure yet"}
                onClick={() => { setService("Not sure yet"); s.setStep(2); }}>Not sure yet</button>
            </div>
          </div>
          <div className={"fstep" + (s.step === 2 ? " on" : "")} data-step="2">
            <h3>Where is it, and what kind of building?</h3>
            <div className="opts" data-group="type">
              {["Home", "Business", "Industrial", "Other"].map((k) => (
                <button key={k} className="opt" type="button" aria-pressed={kind === k} onClick={() => setKind(k)}>{k}</button>
              ))}
            </div>
            <div className="field"><label htmlFor="area">Area and street</label>
              <input id="area" value={f.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. Ikeja, Lagos" /></div>
            <div className="field"><label htmlFor="details">What is the job?</label>
              <textarea id="details" value={f.details} onChange={(e) => set("details", e.target.value)} placeholder="A few lines are enough." /></div>
          </div>
          <div className={"fstep" + (s.step === 3 ? " on" : "")} data-step="3">
            <h3>How do we reach you?</h3>
            <div className="field"><label htmlFor="name">Name</label><input id="name" value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div className="field"><label htmlFor="phone">Phone or WhatsApp</label><input id="phone" type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0816 168 3153" /></div>
            <div className="field"><label htmlFor="email">Email (optional)</label><input id="email" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
          </div>
          {s.error && <p className="ferror" role="alert">{s.error}</p>}
          <div className="fnav">
            <button className="btn btn-line back" type="button" hidden={s.step === 1} onClick={() => { s.setError(""); s.setStep(s.step - 1); }}>Back</button>
            {s.step < 3
              ? <button className="btn btn-red next" type="button" onClick={() => s.setStep(s.step + 1)}>Continue</button>
              : <a className="btn btn-red next" href={send} target="_blank" rel="noopener noreferrer" onClick={(e) => {
                  if (!f.name.trim() || !f.phone.trim()) { e.preventDefault(); s.setError("Please add your name and a phone number, so we can reach you."); return; }
                  s.setError(""); void record().then((ok) => { if (!ok) s.setUnsaved(true); }); s.setSent(true);
                }}>Send request</a>}
          </div>
        </>
      )}
      <div className={"sent" + (s.sent ? " on" : "")}>
        <div className="tick" />
        <h3>Thank you. Your request is on its way.</h3>
        <p className="lead" style={{ marginTop: 10 }}>If WhatsApp did not open, call {company.contact.phoneDisplay} or email {company.contact.email}.</p>
        {s.unsaved && <p className="ferror" role="alert">Our website could not keep a copy of your request, so please make sure you press Send in WhatsApp, or call us.</p>}
      </div>
    </form>
  );
}

/** The careers application. */
export function CareersForm() {
  const s = useSteps(2);
  const [prog, setProg] = useState("");
  const [f, setF] = useState({ school: "", when: "", name: "", phone: "", email: "", note: "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [trap, setTrap] = useState("");
  const openedAt = useOpenedAt();
  const record = () => sendEnquiry({
    kind: "careers", name: f.name, phone: f.phone, email: f.email, website: trap, openedAt,
    fields: [["Programme", prog], ["School", f.school], ["Available", f.when], ["Note", f.note]],
  });
  const send = waLink(["Hello MOJATECH, I would like to apply.", prog && `Programme: ${prog}.`, f.school && `School: ${f.school}.`,
    f.when && `Available: ${f.when}.`, f.name && `Name: ${f.name}.`, f.phone && `Phone: ${f.phone}.`, f.email && `Email: ${f.email}.`, f.note && `Note: ${f.note}`]);

  return (
    <form className="form careers-form" noValidate onSubmit={(e) => e.preventDefault()}>
      <Trap value={trap} onChange={setTrap} />
      {!s.sent && (
        <>
          <div className={"fstep" + (s.step === 1 ? " on" : "")} data-step="1">
            <h3>Which programme?</h3>
            <div className="opts" data-group="programme">
              {["Internship", "Apprenticeship", "NYSC placement", "Industrial training (SIWES)"].map((p) => (
                <button key={p} className="opt" type="button" aria-pressed={prog === p} onClick={() => setProg(p)}>{p}</button>
              ))}
            </div>
            <div className="field"><label htmlFor="school">School or institution</label>
              <input id="school" value={f.school} onChange={(e) => set("school", e.target.value)} placeholder="e.g. Yaba College of Technology" /></div>
            <div className="field"><label htmlFor="when">When can you start?</label>
              <input id="when" value={f.when} onChange={(e) => set("when", e.target.value)} placeholder="e.g. March, for 6 months" /></div>
          </div>
          <div className={"fstep" + (s.step === 2 ? " on" : "")} data-step="2">
            <h3>How do we reach you?</h3>
            <div className="field"><label htmlFor="cname">Name</label><input id="cname" value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div className="field"><label htmlFor="cphone">Phone or WhatsApp</label><input id="cphone" type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} /></div>
            <div className="field"><label htmlFor="cemail">Email</label><input id="cemail" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
            <div className="field"><label htmlFor="cnote">Anything else? (optional)</label>
              <textarea id="cnote" value={f.note} onChange={(e) => set("note", e.target.value)} placeholder="Tell us what you already know, or what you want to learn." /></div>
          </div>
          {s.error && <p className="ferror" role="alert">{s.error}</p>}
          <div className="fnav">
            <button className="btn btn-line back" type="button" hidden={s.step === 1} onClick={() => { s.setError(""); s.setStep(s.step - 1); }}>Back</button>
            {s.step < 2
              ? <button className="btn btn-red next" type="button" onClick={() => { if (!prog) { s.setError("Please choose a programme."); return; } s.setError(""); s.setStep(2); }}>Continue</button>
              : <a className="btn btn-red next" href={send} target="_blank" rel="noopener noreferrer" onClick={(e) => {
                  if (!f.name.trim() || !(f.phone.trim() || f.email.trim())) { e.preventDefault(); s.setError("Please add your name and a phone number or email, so we can reach you."); return; }
                  s.setError(""); void record().then((ok) => { if (!ok) s.setUnsaved(true); }); s.setSent(true);
                }}>Send application</a>}
          </div>
        </>
      )}
      <div className={"sent" + (s.sent ? " on" : "")}>
        <div className="tick" />
        <h3>Thank you. Your application is in.</h3>
        <p className="lead" style={{ marginTop: 10 }}>You can also email your CV to {company.contact.emailHr}.</p>
        {s.unsaved && <p className="ferror" role="alert">Our website could not keep a copy of your application, so please make sure you press Send in WhatsApp, or email us.</p>}
      </div>
    </form>
  );
}
