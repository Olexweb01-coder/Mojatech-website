"use server";

import { revalidatePath } from "next/cache";
import { getMe, logActivity } from "@/lib/admin-auth";
import { ownerKey } from "@/lib/arik/store";
import { recipients } from "@/lib/push";
import { addItem, updateItem, setDone, deleteItem, getItem, fromLagos, ITEM_KINDS, REPEATS, type ItemInput } from "@/lib/schedule";

export type Result = { ok?: string; error?: string; at?: number } | null;

const text = (f: FormData, k: string, n: number) => String(f.get(k) ?? "").trim().slice(0, n);

async function mayEdit(id: string) {
  const me = await getMe();
  if (!me) return null;
  const item = await getItem(id);
  const owner = ownerKey(me);
  if (!item) return null;
  /* Shared items can be changed by anyone; private ones by their owner and creator. */
  return item.assignee === "everyone" || item.assignee === owner || item.createdBy === owner || me.role === "owner" ? { me, item } : null;
}

export async function saveItem(_prev: Result, f: FormData): Promise<Result> {
  const me = await getMe();
  if (!me) return { error: "Please sign in again.", at: Date.now() };
  const title = text(f, "title", 140);
  const when = text(f, "when", 20);
  if (!title) return { error: "Say what it is.", at: Date.now() };
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(when)) return { error: "Choose a date and time.", at: Date.now() };
  const assignee = text(f, "assignee", 40) || ownerKey(me);
  const valid = assignee === "everyone" || (await recipients()).some((r) => r.owner === assignee);
  const input: ItemInput = {
    title, kind: ITEM_KINDS[text(f, "kind", 20)] ? text(f, "kind", 20) : "reminder",
    startsAt: fromLagos(when).toISOString(), location: text(f, "location", 160), notes: text(f, "notes", 1000),
    assignee: valid ? assignee : ownerKey(me), remindBefore: Math.max(0, Math.min(10080, Number(f.get("remind")) || 0)),
    repeat: REPEATS[text(f, "repeat", 10)] ? text(f, "repeat", 10) : "none", alarm: f.get("alarm") === "on",
    enquiryId: /^\d+$/.test(text(f, "enquiryId", 18)) ? text(f, "enquiryId", 18) : null,
  };
  const id = text(f, "id", 18);
  try {
    if (id) {
      if (!(await mayEdit(id))) return { error: "You cannot change that one.", at: Date.now() };
      await updateItem(id, input);
    } else await addItem(input, ownerKey(me));
  } catch {
    return { error: "Could not save. Try again.", at: Date.now() };
  }
  await logActivity(`${id ? "Updated" : "Scheduled"} “${title}”`);
  revalidatePath("/admin/schedule");
  return { ok: id ? "Saved." : "Added. You will be alerted at the time you chose.", at: Date.now() };
}

export async function toggleDone(id: string, done: boolean): Promise<Result> {
  const ok = await mayEdit(id);
  if (!ok) return { error: "You cannot change that one." };
  await setDone(id, done);
  revalidatePath("/admin/schedule");
  return { ok: done ? "Marked as done." : "Marked as not done." };
}

export async function removeItem(id: string): Promise<Result> {
  const ok = await mayEdit(id);
  if (!ok) return { error: "You cannot delete that one." };
  await deleteItem(id);
  revalidatePath("/admin/schedule");
  return { ok: "Deleted." };
}
