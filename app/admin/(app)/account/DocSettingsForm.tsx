"use client";
import { startTransition, useActionState } from "react";
import { saveDocs, type Result } from "./actions";
import type { DocSettings } from "@/lib/docs/settings";

/* Owners: what prints on every quotation, invoice and receipt Arik makes. */
export default function DocSettingsForm({ s }: { s: DocSettings }) {
  const [state, action, busy] = useActionState<Result, FormData>(saveDocs, null);
  return (
    <section className="mja-card">
      <h2 className="mja-h3">Documents</h2>
      <p className="mja-muted">Printed on every quotation, invoice and receipt Arik makes. Ask Arik, for example: “make a quotation for Tunde: 8 solar panels and a 5kVA inverter, installation ₦150k”.</p>
      <form className="mja-dialog-form" onSubmit={(e) => { e.preventDefault(); const d = new FormData(e.currentTarget); startTransition(() => action(d)); }}>
        <div className="mja-two">
          <div className="mja-field"><label htmlFor="d-bank">Bank</label><input id="d-bank" name="bankName" defaultValue={s.bankName} placeholder="e.g. GTBank" maxLength={80} /></div>
          <div className="mja-field"><label htmlFor="d-num">Account number</label><input id="d-num" name="accountNumber" defaultValue={s.accountNumber} inputMode="numeric" maxLength={20} /></div>
        </div>
        <div className="mja-field"><label htmlFor="d-acct">Account name</label><input id="d-acct" name="accountName" defaultValue={s.accountName} maxLength={120} /></div>
        <div className="mja-two">
          <div className="mja-field"><label htmlFor="d-vat">VAT rate (%), used when you ask for VAT</label><input id="d-vat" name="vatRate" defaultValue={s.vatRate} inputMode="decimal" /></div>
          <div className="mja-field"><label htmlFor="d-days">Quotations valid for (days)</label><input id="d-days" name="validityDays" defaultValue={s.validityDays} inputMode="numeric" /></div>
        </div>
        <div className="mja-field"><label htmlFor="d-terms">Terms (one per line)</label><textarea id="d-terms" name="terms" rows={4} defaultValue={s.terms} /></div>
        <div className="mja-two">
          <div className="mja-field"><label htmlFor="d-sign">Signed by (name)</label><input id="d-sign" name="signName" defaultValue={s.signName} placeholder="e.g. Olaitan Adebayo" maxLength={80} /></div>
          <div className="mja-field"><label htmlFor="d-title">Under the signature</label><input id="d-title" name="signTitle" defaultValue={s.signTitle} maxLength={120} /></div>
        </div>
        <button className="mja-btn red mja-self-start" type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        {state?.ok && <p className="mja-good">{state.ok}</p>}
        {state?.error && <p className="mja-bad">{state.error}</p>}
      </form>
    </section>
  );
}
