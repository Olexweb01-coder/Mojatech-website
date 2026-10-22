"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { allowed, logActivity } from "@/lib/admin-auth";
import { STATUSES, getEnquiry, markSeen, markUnseen, setStatus, addNote, removeEnquiry } from "@/lib/enquiries";

export type Result = { ok?: string; error?: string } | null;

function refresh(id?: string) {
  revalidatePath("/admin", "layout");          /* the unread count in the menu */
  if (id) revalidatePath(`/admin/enquiries/${id}`);
}

export async function seen(id: string) {
  if (!(await allowed("enquiries"))) return;
  await markSeen(id).catch(() => {});
  refresh();
}

export async function unread(id: string): Promise<Result> {
  if (!(await allowed("enquiries"))) return { error: "You are signed out, or your role does not allow this." };
  await markUnseen(id);
  refresh(id);
  redirect("/admin/enquiries");
}

export async function changeStatus(id: string, status: string): Promise<Result> {
  if (!(await allowed("enquiries"))) return { error: "You are signed out, or your role does not allow this." };
  const e = await getEnquiry(id);
  if (!e) return { error: "That enquiry no longer exists." };
  if (!STATUSES[e.kind].some(([v]) => v === status)) return { error: "Unknown status." };
  try { await setStatus(id, status); } catch { return { error: "Could not save. Try again." }; }
  refresh(id);
  await logActivity(`Set enquiry #${id} (${e.name || e.kind}) to ${status}`);
  return { ok: "Status saved." };
}

export async function note(id: string, text: string): Promise<Result> {
  if (!(await allowed("enquiries"))) return { error: "You are signed out, or your role does not allow this." };
  const t = text.trim().slice(0, 2000);
  if (!t) return { error: "Write something first." };
  try { await addNote(id, t); } catch { return { error: "Could not save the note. Try again." }; }
  refresh(id);
  await logActivity(`Added a note to enquiry #${id}`);
  return { ok: "Note added." };
}

export async function remove(f: FormData) {
  if (!(await allowed("enquiries"))) redirect("/admin/login");
  const id = String(f.get("id") || "");
  await removeEnquiry(id).catch(() => {});
  refresh();
  await logActivity(`Deleted enquiry #${id}`);
  redirect("/admin/enquiries?done=deleted");
}
