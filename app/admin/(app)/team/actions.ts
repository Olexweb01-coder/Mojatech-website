"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMe, can, isRole, ROLES, tempPassword, startSession, endSession, logActivity, type Role } from "@/lib/admin-auth";
import { dbConfigured } from "@/lib/store";
import {
  addMember, getMember, emailTaken, otherOwners, setRole, setActive, setPassword, removeMember,
  cleanEmail, validEmail, PASSWORD_MIN,
} from "@/lib/team";

export type Result = { ok?: string; error?: string; temp?: { name: string; email: string; password: string }; at?: number } | null;
const DENIED = "Only an owner can manage the team.";

async function owner() {
  const me = await getMe();
  return me && can(me, "team") ? me : null;
}

const text = (f: FormData, k: string, n: number) => String(f.get(k) ?? "").trim().slice(0, n);

/** Signed in with the master password: create the owner's own account and switch to it. */
export async function createMyAccount(_prev: Result, f: FormData): Promise<Result> {
  const me = await owner();
  if (!me?.master) return { error: "This is only for the master password.", at: Date.now() };
  if (!dbConfigured()) return { error: "Connect the database first.", at: Date.now() };
  const name = text(f, "name", 80), email = cleanEmail(text(f, "email", 160)), pw = String(f.get("password") || ""), pw2 = String(f.get("password2") || "");
  if (!name) return { error: "Add your name.", at: Date.now() };
  if (!validEmail(email)) return { error: "That email does not look right.", at: Date.now() };
  if (pw.length < PASSWORD_MIN) return { error: `Use at least ${PASSWORD_MIN} characters for the password.`, at: Date.now() };
  if (pw !== pw2) return { error: "The two passwords are not the same.", at: Date.now() };
  if (await emailTaken(email)) return { error: "That email already has an account. Sign in with it instead.", at: Date.now() };
  const id = await addMember({ name, email, role: "owner", password: pw, mustChange: false });
  await logActivity(`Created the owner account for ${name}`);
  await endSession();
  await startSession(id, (await headers()).get("user-agent") || "");
  redirect("/admin/team?done=me");
}

export async function inviteMember(_prev: Result, f: FormData): Promise<Result> {
  const me = await owner();
  if (!me) return { error: DENIED, at: Date.now() };
  const name = text(f, "name", 80), email = cleanEmail(text(f, "email", 160)), role = f.get("role");
  if (!name) return { error: "Add their name.", at: Date.now() };
  if (!validEmail(email)) return { error: "That email does not look right.", at: Date.now() };
  if (!isRole(role)) return { error: "Choose a role.", at: Date.now() };
  if (await emailTaken(email)) return { error: "Someone already uses that email.", at: Date.now() };
  const password = tempPassword();
  await addMember({ name, email, role, password, mustChange: true });
  await logActivity(`Added ${name} as ${ROLES[role].label}`);
  revalidatePath("/admin/team");
  return { ok: `${name} can sign in now.`, temp: { name, email, password }, at: Date.now() };
}

export async function changeRole(id: string, role: Role): Promise<Result> {
  const me = await owner();
  if (!me) return { error: DENIED };
  const m = await getMember(id);
  if (!m || !isRole(role)) return { error: "Not found." };
  if (m.role === "owner" && role !== "owner" && (await otherOwners(id)) === 0) return { error: "There must always be at least one owner." };
  await setRole(id, role);
  await logActivity(`Changed ${m.name} to ${ROLES[role].label}`);
  revalidatePath("/admin/team");
  return { ok: `${m.name} is now ${ROLES[role].label}.` };
}

export async function toggleActive(id: string, active: boolean): Promise<Result> {
  const me = await owner();
  if (!me) return { error: DENIED };
  const m = await getMember(id);
  if (!m) return { error: "Not found." };
  if (m.id === me.id && !active) return { error: "You cannot switch yourself off." };
  if (!active && m.role === "owner" && (await otherOwners(id)) === 0) return { error: "There must always be at least one owner." };
  await setActive(id, active);
  await logActivity(`${active ? "Switched on" : "Switched off"} ${m.name}`);
  revalidatePath("/admin/team");
  return { ok: active ? `${m.name} can sign in again.` : `${m.name} is signed out and cannot sign in.` };
}

export async function resetPassword(id: string): Promise<Result> {
  const me = await owner();
  if (!me) return { error: DENIED };
  const m = await getMember(id);
  if (!m) return { error: "Not found." };
  if (m.id === me.id) return { error: "Change your own password from Your account." };
  const password = tempPassword();
  await setPassword(id, password, true);
  await logActivity(`Reset the password for ${m.name}`);
  revalidatePath("/admin/team");
  return { ok: "New temporary password made.", temp: { name: m.name, email: m.email, password } };
}

export async function deleteMember(id: string): Promise<Result> {
  const me = await owner();
  if (!me) return { error: DENIED };
  const m = await getMember(id);
  if (!m) return { error: "Not found." };
  if (m.id === me.id) return { error: "You cannot remove yourself." };
  if (m.role === "owner" && (await otherOwners(id)) === 0) return { error: "There must always be at least one owner." };
  await removeMember(id);
  await logActivity(`Removed ${m.name} from the team`);
  revalidatePath("/admin/team");
  return { ok: `${m.name} has been removed.` };
}
