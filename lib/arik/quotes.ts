import { streamReply } from "@/lib/arik/providers";
import { saveFile, getFiles, type FileRef } from "@/lib/arik/store";
import { listAllProducts, dbConfigured } from "@/lib/store";
import { can, type Me } from "@/lib/admin-auth";
import { getDocSettings } from "@/lib/docs/settings";
import { nextNumber, sanitise, totals, naira, todayLagos, DOC_LABEL, type Quote, type DocType } from "@/lib/docs/quote";

/* "Make a quotation for Tunde: 8 panels at 185k and a 5kVA inverter at 1.25m",
 * "add 10% discount", "turn it into an invoice, he paid 1.5m".
 * Arik fills in a quotation, invoice, pro-forma or receipt; the code numbers it,
 * does every sum, and makes the PDF and Word files. */

export const DOC_MIME = "application/vnd.mojatech.doc+json";
/** Any other document: the text of a reply, made into PDF and Word on request. */
export const MD_MIME = "text/markdown; mojatech=document";

const FILE_WORDS = /\b(pdf|word|docx|doc file|document|printable|letterhead)\b/i;
const MAKE_WORDS = /\b(make|create|give|send|generate|export|turn|convert|do|prepare|produce|save|put|draft|write|need|want)\b/i;
/** "Make that a PDF", "can you do the pdf yourself?", "write a proposal for X as a Word document". */
export const wantsFile = (text: string) => FILE_WORDS.test(text) && MAKE_WORDS.test(text) && !QUOTE_HINT.test(text);
/** True when the request is about the previous reply rather than new content. */
export const aboutPrevious = (text: string) =>
  text.length < 160 && /\b(this|that|it|above|yourself|previous|last|same|the (answer|reply|text|one))\b/i.test(text) && !/\b(about|for|on|regarding)\b\s+\w{4,}/i.test(text.replace(/\b(for|on) (me|us|it|this|that)\b/gi, ""));
export const QUOTE_HINT = /\b(quotations?|quotes?|invoices?|pro-?forma|receipts?)\b/i;
const ACTION_HINT = /\b(make|create|prepare|generate|draft|write|do|give|raise|issue|send|need|update|change|revise|add|remove|increase|reduce|turn|convert|apply|include|put|set)\b/i;

export const wantsQuote = (text: string, chatHasDoc: boolean) =>
  (QUOTE_HINT.test(text) && ACTION_HINT.test(text)) ||
  (chatHasDoc && /\b(add|remove|change|update|make it|instead|discount|vat|qty|quantity|price|delete|replace|increase|reduce|paid|deposit|balance|client|customer|valid)\b/i.test(text) && text.length < 400);

type Raw = Partial<Quote> & { action?: "new" | "revise" | "ask"; question?: string };

export async function handleQuote(o: {
  text: string; me: Me; owner: string; signal: AbortSignal;
  history: { role: "user" | "assistant"; content: string; files: FileRef[] }[];
}): Promise<{ content: string; files: FileRef[] } | null> {
  const settings = await getDocSettings();

  /* The latest document in this chat, so "add a discount" changes it. */
  const docRefs = o.history.flatMap((m) => m.files).filter((f) => f.kind === "doc");
  let previous: Quote | null = null;
  if (docRefs.length) {
    const [f] = await getFiles([docRefs[docRefs.length - 1].id]);
    if (f?.mime === DOC_MIME) try { previous = JSON.parse(f.text) as Quote; } catch { /* ignore */ }
  }

  const products = can(o.me, "products") && dbConfigured()
    ? (await listAllProducts().catch(() => [])).map((p) => `- ${p.name}: ${naira(p.price)}`).join("\n") : "";
  const convo = o.history.slice(-8).filter((m) => m.content).map((m) => `${m.role === "user" ? "Person" : "Assistant"}: ${m.content.slice(0, 700)}`).join("\n");

  let raw = "";
  try {
    await streamReply([
      { role: "system", content: `You prepare MOJATECH business documents. Today is ${todayLagos()} (Lagos). Reply with JSON only.
Schema:
{"action":"new"|"revise"|"ask","question":"only when action is ask","type":"quotation"|"invoice"|"proforma"|"receipt",
 "client":{"name":"","phone":"","email":"","address":""},"title":"short subject, e.g. Supply and installation of 5kVA solar system",
 "items":[{"description":"","qty":1,"unit":"pcs|m|set|lot|days|","unitPrice":0}],
 "discount":null or {"type":"percent"|"amount","value":0},"vat":false,"amountPaid":0,"notes":"","validityDays":${settings.validityDays}}
Rules:
- Prices are in naira as plain numbers: "185k" = 185000, "1.25m" = 1250000.
- Never invent a price. Use prices the person gave, or the catalogue below. If any item has no price from either, use action "ask" and ask for those prices in one short question.
- If the person is changing the previous document, use action "revise" and return the WHOLE updated document, starting from the previous one. "Turn it into an invoice/receipt" is "new" with the new type and the same items.
- VAT only when the person asks for it. Include installation, cabling, accessories or labour only if the person mentions them (with a price).
- unitPrice is per unit; qty times unitPrice is the line amount. Do not compute totals.
- If no client name is given, use "Customer".
${products ? `MOJATECH catalogue prices:\n${products}` : ""}
${previous ? `Previous document in this chat:\n${JSON.stringify(previous)}` : ""}` },
      { role: "user", content: `Conversation so far:\n${convo}\n\nLatest request: ${o.text}` },
    ], { intent: "fast", long: false, signal: o.signal, onToken: (t) => { raw += t; } });
  } catch { return null; }

  let r: Raw;
  try { r = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)); } catch { return null; }
  if (r.action === "ask" && r.question) return { content: r.question, files: [] };
  if (!r.items?.length) return null;

  const type: DocType = (["quotation", "invoice", "proforma", "receipt"] as DocType[]).includes(r.type as DocType) ? r.type as DocType : previous?.type || "quotation";
  const revising = r.action === "revise" && previous && previous.type === type;
  const number = revising ? previous!.number : await nextNumber(type);
  const q = sanitise(r, { type, number, rev: revising ? previous!.rev + 1 : 1, vatRate: settings.vatRate, validityDays: settings.validityDays });
  if (!q.items.length) return null;
  const t = totals(q);

  const label = DOC_LABEL[type];
  const num = q.rev > 1 ? `${q.number} rev. ${q.rev}` : q.number;
  const id = await saveFile(o.owner, { name: `${label} ${num} · ${q.client.name} · ${naira(t.total)}`, mime: DOC_MIME, kind: "doc", text: JSON.stringify(q), bytes: null });
  const missing = !settings.accountNumber && type !== "receipt" ? "\n\n_Tip: add your bank details in **Your account → Documents** so they print on every quotation and invoice._" : "";
  const zero = q.items.filter((l) => !l.unitPrice).map((l) => l.description);
  return {
    content: `${revising ? "Updated" : "Here is"} **${label} ${num}** for **${q.client.name}**: ${q.items.length} item${q.items.length > 1 ? "s" : ""}, total **${naira(t.total)}**${q.amountPaid ? `, balance **${naira(t.balance)}**` : ""}.
${zero.length ? `\n⚠️ No price yet for: ${zero.join(", ")}. Tell me the price and I'll update it.\n` : ""}
Download it as **PDF** to send, or **Word** to edit. To change anything, just say so, for example “make it 6 panels”, “add 10% discount”, “add VAT”, or “turn it into an invoice, he paid ₦1.5m”.${missing}`,
    files: [{ id, name: `${label} ${num} · ${q.client.name}`, kind: "doc" }],
  };
}
