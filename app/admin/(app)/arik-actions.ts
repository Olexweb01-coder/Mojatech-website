"use server";

import { revalidatePath } from "next/cache";
import { getMe, can, logActivity } from "@/lib/admin-auth";
import { setArikSettings } from "@/lib/arik/store";

/** Owners can give the assistant another name. */
export async function renameAssistant(_prev: { ok?: string; error?: string } | null, f: FormData) {
  const me = await getMe();
  if (!me || !can(me, "team")) return { error: "Only an owner can rename the assistant." };
  const name = String(f.get("name") || "").replace(/[^\p{L}\p{N} .'-]/gu, "").trim().slice(0, 24);
  if (!name) return { error: "Give it a name." };
  await setArikSettings({ name });
  await logActivity(`Renamed the assistant to ${name}`);
  revalidatePath("/admin", "layout");
  return { ok: `The assistant is now called ${name}.` };
}
