import { kvGet, kvSet } from "@/lib/store";

/* What goes on MOJATECH's quotations, invoices and letters. Set by owners in
 * Your account → Documents. */

export type DocSettings = {
  bankName: string; accountName: string; accountNumber: string;
  vatRate: number;            /* percent; Nigeria's VAT is 7.5% */
  validityDays: number;       /* how long a quotation stands */
  terms: string;              /* printed under every quotation and invoice */
  signName: string; signTitle: string;
};

export const DOC_DEFAULTS: DocSettings = {
  bankName: "", accountName: "MOJATECH Electrical Enterprises", accountNumber: "",
  vatRate: 7.5, validityDays: 14,
  terms: "70% payment confirms the order and covers materials; the balance is due on completion and testing.\nPrices include installation within Lagos and Ogun unless stated.\nWorkmanship is guaranteed for 12 months; equipment carries the manufacturer's warranty.",
  signName: "", signTitle: "For MOJATECH Electrical Enterprises",
};

export async function getDocSettings(): Promise<DocSettings> {
  return { ...DOC_DEFAULTS, ...((await kvGet<Partial<DocSettings>>("docs").catch(() => undefined)) || {}) };
}

export async function setDocSettings(s: DocSettings) {
  await kvSet("docs", s);
}
