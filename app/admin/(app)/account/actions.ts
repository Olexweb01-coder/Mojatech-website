"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMe, checkPassword, currentSession, logActivity } from "@/lib/admin-auth";
import { setName, setPassword, passwordHashOf, signOutOthers, PASSWORD_MIN } from "@/lib/team";
import { ownerKey } from "@/lib/arik/store";
import { setPrefs, ALERTS, type AlertKind } from "@/lib/push";
import { setDocSettings } from "@/lib/docs/settings";

export type Result = { ok?: string; error?: string; at?: number } | null;

export async function saveName(_prev: Result, f: FormData): Promise<Result> {
  const me = await getMe();
  if (!me?.id) return { error: "Create your own account first (Team).", at: Date.now() };
  const name = String(f.get("name") || "").trim().slice(0, 80);
  if (!name) return { error: "Add your name.", at: Date.now() };
  await setName(me.id, name);
  revalidatePath("/admin", "layout");
  return { ok: "Name saved.", at: Date.now() };
}

export async function changePassword(_prev: Result, f: FormData): Promise<Result> {
  const me = await getMe();
  if (!me?.id) return { error: "Create your own account first (Team).", at: Date.now() };
  const current = String(f.get("current") || ""), pw = String(f.get("password") || ""), pw2 = String(f.get("password2") || "");
  if (!(await checkPassword(current, await passwordHashOf(me.id)))) return { error: "Your current password is not right.", at: Date.now() };
  if (pw.length < PASSWORD_MIN) return { error: `Use at least ${PASSWORD_MIN} characters.`, at: Date.now() };
  if (pw !== pw2) return { error: "The two new passwords are not the same.", at: Date.now() };
  if (pw === current) return { error: "Choose a password different from the current one.", at: Date.now() };
  const wasFirst = me.mustChange;
  await setPassword(me.id, pw, false, await currentSession());
  await logActivity("Changed their password");
  revalidatePath("/admin", "layout");
  if (wasFirst) redirect("/admin?welcome=1");
  return { ok: "Password changed. Your other devices are signed out.", at: Date.now() };
}

export async function signOutEverywhereElse(): Promise<Result> {
  const me = await getMe();
  if (!me) return { error: "Please sign in again." };
  await signOutOthers(me.id, await currentSession());
  await logActivity("Signed out of their other devices");
  return { ok: "Signed out on every other device." };
}

/* ---------- Alerts ---------- */


export async function saveAlerts(prefs: Record<string, boolean>): Promise<Result> {
  const me = await getMe();
  if (!me) return { error: "Please sign in again." };
  const clean = Object.fromEntries((Object.keys(ALERTS) as AlertKind[]).map((k) => [k, prefs[k] !== false])) as Record<AlertKind, boolean>;
  await setPrefs(ownerKey(me), clean);
  return { ok: "Alert choices saved." };
}

/* ---------- What prints on quotations and invoices (owners) ---------- */

export async function saveDocs(_prev: Result, f: FormData): Promise<Result> {
  const me = await getMe();
  if (!me || me.role !== "owner") return { error: "Only an owner can change these.", at: Date.now() };
  const t = (k: string, n: number) => String(f.get(k) ?? "").trim().slice(0, n);
  const vat = Number(t("vatRate", 6)), days = Number(t("validityDays", 4));
  await setDocSettings({
    bankName: t("bankName", 80), accountName: t("accountName", 120), accountNumber: t("accountNumber", 20).replace(/\D/g, ""),
    vatRate: Number.isFinite(vat) && vat >= 0 && vat <= 50 ? vat : 7.5,
    validityDays: Number.isFinite(days) && days > 0 && days <= 365 ? Math.round(days) : 14,
    terms: t("terms", 2000), signName: t("signName", 80), signTitle: t("signTitle", 120) || "For MOJATECH Electrical Enterprises",
  });
  await logActivity("Updated the document settings");
  return { ok: "Saved. New documents use these details.", at: Date.now() };
}
