"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMe, checkPassword, currentSession, logActivity } from "@/lib/admin-auth";
import { setName, setPassword, passwordHashOf, signOutOthers, PASSWORD_MIN } from "@/lib/team";
import { ownerKey } from "@/lib/arik/store";
import { setPrefs, ALERTS, type AlertKind } from "@/lib/push";

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
