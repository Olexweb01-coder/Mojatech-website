import { NextResponse } from "next/server";

/**
 * Contact form handler.
 *
 * Set CONTACT_WEBHOOK_URL in .env.local to any endpoint that accepts a
 * JSON POST (Formspree, Basin, Make/Zapier webhook, a mail API route,
 * etc.) and submissions will be forwarded there. Until then, the route
 * honestly reports "unconfigured" so the form can direct visitors to
 * call/WhatsApp/email instead of pretending to send.
 */
export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  // Server-side sanity checks (mirrors client validation)
  const name = String(payload.name ?? "").trim();
  const email = String(payload.email ?? "").trim();
  const message = String(payload.message ?? "").trim();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }
  // Honeypot
  if (String(payload.company_website ?? "").trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (!webhook) {
    return NextResponse.json({ ok: false, reason: "unconfigured" }, { status: 503 });
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "mojatech-website",
        submittedAt: new Date().toISOString(),
        name,
        email,
        phone: String(payload.phone ?? ""),
        companyName: String(payload.companyName ?? ""),
        projectType: String(payload.projectType ?? ""),
        location: String(payload.location ?? ""),
        message,
      }),
    });
    if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, reason: "delivery" }, { status: 502 });
  }
}
