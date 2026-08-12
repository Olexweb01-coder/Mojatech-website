"use client";

import { useState, type FormEvent } from "react";
import {
  company,
  isProvided,
  phoneHref,
  whatsappHref,
  emailHref,
} from "@/lib/data/company";

const projectTypes = [
  "Electrical Engineering",
  "Solar Power",
  "Security",
  "Safety",
  "Facility Management",
  "Electrical Consultancy",
  "General Building Management",
  "Other",
];

type Status = "idle" | "loading" | "success" | "error" | "unconfigured";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    // Honeypot — bots fill hidden fields; humans never see it.
    if (data.company_website) return;

    const nextErrors: Record<string, string> = {};
    if (!data.name?.trim()) nextErrors.name = "Please enter your name.";
    if (!data.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      nextErrors.email = "Please enter a valid email address.";
    if (!data.projectType) nextErrors.projectType = "Please choose a project type.";
    if (!data.message?.trim() || data.message.trim().length < 10)
      nextErrors.message = "Tell us a little about the project (at least 10 characters).";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as { ok: boolean; reason?: string };
      if (json.ok) {
        setStatus("success");
        form.reset();
      } else if (json.reason === "unconfigured") {
        setStatus("unconfigured");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const tel = phoneHref();
  const wa = whatsappHref();
  const mail = emailHref();

  if (status === "success") {
    return (
      <div className="border border-line bg-panel p-8" role="status">
        <p className="label-tech">Request received</p>
        <h3 className="display mt-4 text-3xl">Connection established.</h3>
        <p className="mt-4 text-steel">
          Thank you — your project request has been sent. MOJATECH will get back to you
          as soon as possible.
        </p>
        <button type="button" onClick={() => setStatus("idle")} className="btn-ghost mt-6">
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {/* Honeypot */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company_website">Leave this field empty</label>
        <input id="company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="name">Name *</label>
          <input className="field" id="name" name="name" type="text" autoComplete="name" required />
          {errors.name && <p className="mt-2 text-xs text-brand-redBright" role="alert">{errors.name}</p>}
        </div>
        <div>
          <label className="field-label" htmlFor="companyName">Company</label>
          <input className="field" id="companyName" name="companyName" type="text" autoComplete="organization" />
        </div>
        <div>
          <label className="field-label" htmlFor="email">Email *</label>
          <input className="field" id="email" name="email" type="email" autoComplete="email" required />
          {errors.email && <p className="mt-2 text-xs text-brand-redBright" role="alert">{errors.email}</p>}
        </div>
        <div>
          <label className="field-label" htmlFor="phone">Phone</label>
          <input className="field" id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" />
        </div>
        <div>
          <label className="field-label" htmlFor="projectType">Project type *</label>
          <select className="field" id="projectType" name="projectType" defaultValue="" required>
            <option value="" disabled>Select a project type</option>
            {projectTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {errors.projectType && (
            <p className="mt-2 text-xs text-brand-redBright" role="alert">{errors.projectType}</p>
          )}
        </div>
        <div>
          <label className="field-label" htmlFor="location">Project location</label>
          <input className="field" id="location" name="location" type="text" placeholder="e.g. Lekki, Lagos" />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="message">Message *</label>
        <textarea className="field min-h-[150px]" id="message" name="message" required />
        {errors.message && <p className="mt-2 text-xs text-brand-redBright" role="alert">{errors.message}</p>}
      </div>

      <p className="text-xs leading-relaxed text-steel">
        Your details are used only to respond to this request and are never shared or
        used for unrelated marketing.
      </p>

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={status === "loading"} data-cursor="Connect">
        {status === "loading" ? "Sending…" : "Send project request"}{" "}
        <span className="btn-arrow">→</span>
      </button>

      {status === "error" && (
        <p className="border border-brand-red/50 bg-brand-red/10 p-4 text-sm" role="alert">
          Something went wrong while sending your request. Please try again
          {mail ? (
            <> or email us directly at <a className="link-line" href={mail}>{company.contact.email}</a></>
          ) : null}
          .
        </p>
      )}

      {status === "unconfigured" && (
        <div className="border border-brand-blueBright/40 bg-brand-blue/10 p-4 text-sm" role="alert">
          <p>
            The online form is not connected to a delivery service yet, so your message
            was not sent. Please reach MOJATECH directly:
          </p>
          <ul className="mt-3 space-y-1">
            {tel && <li><a className="link-line" href={tel}>Call {company.contact.phone}</a></li>}
            {wa && <li><a className="link-line" href={wa} target="_blank" rel="noopener noreferrer">Message on WhatsApp</a></li>}
            {mail && <li><a className="link-line" href={mail}>Email {company.contact.email}</a></li>}
            {!tel && !wa && !mail && (
              <li className="text-steel">
                (Site owner: add contact details in <code>lib/data/company.ts</code> and set{" "}
                <code>CONTACT_WEBHOOK_URL</code> in <code>.env.local</code>.)
              </li>
            )}
          </ul>
        </div>
      )}

      {!isProvided(company.contact.email) && status === "idle" && null}
    </form>
  );
}
