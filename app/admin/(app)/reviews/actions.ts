"use server";

import { revalidatePath } from "next/cache";
import { allowed, logActivity } from "@/lib/admin-auth";
import { dbConfigured } from "@/lib/store";
import { addReview, updateReview, setReviewStatus, deleteReview, type ReviewStatus } from "@/lib/reviews";

export type Result = { ok?: string; error?: string; at?: number } | null;

function refresh() {
  revalidatePath("/");
  revalidatePath("/work");
  revalidatePath("/admin", "layout");
}

const STATUSES: ReviewStatus[] = ["pending", "published", "hidden"];
const text = (f: FormData, k: string, n: number) => String(f.get(k) ?? "").trim().slice(0, n);

export async function saveReview(_prev: Result, f: FormData): Promise<Result> {
  if (!(await allowed("reviews"))) return { error: "You are signed out, or your role does not allow this.", at: Date.now() };
  if (!dbConfigured()) return { error: "No database is connected yet.", at: Date.now() };
  const name = text(f, "name", 80), body = text(f, "text", 1200);
  if (!name) return { error: "Add the customer's name.", at: Date.now() };
  if (body.length < 5) return { error: "Add what they said.", at: Date.now() };
  const rating = Math.min(5, Math.max(1, Number(f.get("rating")) || 5));
  const status = f.get("publish") === "on" ? "published" : "hidden";
  const r = { name, place: text(f, "place", 80), rating, text: body, service: text(f, "service", 80), status: status as ReviewStatus };
  const id = text(f, "id", 20);
  try {
    if (id) await updateReview(id, r);
    else await addReview({ ...r, source: "admin" });
  } catch {
    return { error: "Could not save. Try again.", at: Date.now() };
  }
  refresh();
  await logActivity(`${id ? "Edited" : "Added"} a review from ${name}`);
  return { ok: status === "published" ? "Saved and showing on the website." : "Saved. Not on the website.", at: Date.now() };
}

export async function changeReview(id: string, status: ReviewStatus): Promise<Result> {
  if (!(await allowed("reviews"))) return { error: "You are signed out, or your role does not allow this." };
  if (!STATUSES.includes(status)) return { error: "Unknown status." };
  try { await setReviewStatus(id, status); } catch { return { error: "Could not change that. Try again." }; }
  refresh();
  await logActivity(`${status === "published" ? "Published" : status === "hidden" ? "Hid" : "Moved back"} a review (#${id})`);
  return { ok: status === "published" ? "Published. It is on the website." : status === "hidden" ? "Hidden from the website." : "Moved back to waiting." };
}

export async function removeReview(id: string): Promise<Result> {
  if (!(await allowed("reviews"))) return { error: "You are signed out, or your role does not allow this." };
  try { await deleteReview(id); } catch { return { error: "Could not delete. Try again." }; }
  refresh();
  await logActivity(`Deleted a review (#${id})`);
  return { ok: "Deleted." };
}
