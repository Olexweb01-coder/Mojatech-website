import { sql } from "@/lib/store";

/* Quotations, invoices, pro-forma invoices and receipts.
 * Arik works out what goes in them; the sums are always done here in code,
 * never by the AI, so totals are exact. */

export type DocType = "quotation" | "invoice" | "proforma" | "receipt";
export const DOC_LABEL: Record<DocType, string> = { quotation: "Quotation", invoice: "Invoice", proforma: "Pro-forma invoice", receipt: "Receipt" };
const PREFIX: Record<DocType, string> = { quotation: "QT", invoice: "INV", proforma: "PF", receipt: "RCT" };

export type Line = { description: string; qty: number; unit: string; unitPrice: number };
export type Quote = {
  type: DocType; number: string; rev: number; date: string;          /* date: YYYY-MM-DD, Lagos */
  client: { name: string; phone?: string; email?: string; address?: string };
  title: string;
  items: Line[];
  discount?: { type: "percent" | "amount"; value: number };
  vat: boolean; vatRate: number;
  amountPaid?: number;              /* receipts and part-paid invoices */
  notes?: string;
  validityDays?: number;
};

export type Totals = { lines: (Line & { total: number })[]; subtotal: number; discount: number; vat: number; total: number; balance: number };

const r2 = (n: number) => Math.round(n * 100) / 100;

export function totals(q: Quote): Totals {
  const lines = q.items.map((l) => ({ ...l, total: r2(l.qty * l.unitPrice) }));
  const subtotal = r2(lines.reduce((s, l) => s + l.total, 0));
  const discount = !q.discount ? 0 : r2(q.discount.type === "percent" ? subtotal * Math.min(100, q.discount.value) / 100 : Math.min(subtotal, q.discount.value));
  const vat = q.vat ? r2((subtotal - discount) * q.vatRate / 100) : 0;
  const total = r2(subtotal - discount + vat);
  return { lines, subtotal, discount, vat, total, balance: r2(total - (q.amountPaid || 0)) };
}

export const naira = (n: number) => "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

/** The next number for this kind of document this year: QT-2026-0001, QT-2026-0002, … */
export async function nextNumber(type: DocType) {
  const year = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric" }).format(new Date());
  const key = `docseq:${PREFIX[type]}:${year}`;
  const r = await sql<{ value: number }>(
    `INSERT INTO kv (key, value, updated_at) VALUES ($1, '1'::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = to_jsonb((kv.value #>> '{}')::int + 1), updated_at = now()
     RETURNING value`, [key]);
  return `${PREFIX[type]}-${year}-${String(r[0].value).padStart(4, "0")}`;
}

export const todayLagos = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
export const longDate = (ymd: string) => new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(ymd + "T12:00:00Z"));
export const addDays = (ymd: string, d: number) => new Date(new Date(ymd + "T12:00:00Z").getTime() + d * 86400_000).toISOString().slice(0, 10);

/** Cleans what the AI produced into a safe, complete document. */
export function sanitise(raw: Partial<Quote>, base: { type: DocType; number: string; rev: number; vatRate: number; validityDays: number }): Quote {
  const num = (v: unknown, d = 0) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : d; };
  const s = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
  return {
    type: base.type, number: base.number, rev: base.rev, date: todayLagos(),
    client: { name: s(raw.client?.name, 120) || "Customer", phone: s(raw.client?.phone, 40), email: s(raw.client?.email, 120), address: s(raw.client?.address, 240) },
    title: s(raw.title, 160),
    items: (raw.items || []).slice(0, 60).map((l) => ({ description: s(l.description, 300), qty: num(l.qty, 1) || 1, unit: s(l.unit, 20), unitPrice: num(l.unitPrice) })).filter((l) => l.description),
    discount: raw.discount && num(raw.discount.value) > 0 ? { type: raw.discount.type === "amount" ? "amount" : "percent", value: num(raw.discount.value) } : undefined,
    vat: Boolean(raw.vat), vatRate: base.vatRate,
    amountPaid: num(raw.amountPaid) || undefined,
    notes: s(raw.notes, 1500),
    validityDays: base.type === "quotation" ? num(raw.validityDays, base.validityDays) || base.validityDays : undefined,
  };
}
