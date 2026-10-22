"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { allowed, logActivity } from "@/lib/admin-auth";
import { dbConfigured, pruneMedia } from "@/lib/store";
import { announce } from "@/lib/indexnow";
import {
  createProject, updateProject, deleteProject, getAnyProject, setProjectVisible, reorderProjects, freeProjectSlug, type ProjectInput,
} from "@/lib/work";

export type Result = { ok?: string; error?: string; at?: number } | null;
const NO_DB = "No database is connected yet.";

function refresh(slugs: string[] = []) {
  revalidatePath("/");
  revalidatePath("/work");
  for (const s of slugs) { revalidatePath(`/work/${s}`); revalidatePath(`/admin/work/${s}`); }
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/work");
}

const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function saveProject(_prev: Result, f: FormData): Promise<Result> {
  if (!(await allowed("work"))) return { error: "You are signed out, or your role does not allow this." };
  if (!dbConfigured()) return { error: NO_DB };
  const title = text(f, "title");
  if (!title) return { error: "Give the project a name, such as the place or the client.", at: Date.now() };
  let photos: string[] = [];
  try { photos = (JSON.parse(text(f, "photos") || "[]") as unknown[]).filter((x): x is string => typeof x === "string" && x.startsWith("/")).slice(0, 12); } catch {}
  if (!photos.length) return { error: "Add at least one photo.", at: Date.now() };

  const existing = text(f, "slug");
  const slug = existing || (await freeProjectSlug(title));
  const p: ProjectInput = {
    slug, title: title.slice(0, 120), type: text(f, "type").slice(0, 120), location: text(f, "location").slice(0, 120),
    story: text(f, "story").slice(0, 4000), alt: text(f, "alt").slice(0, 200), photos, visible: f.get("visible") === "on",
  };
  try {
    if (existing) await pruneMedia(await updateProject(p));
    else await createProject(p);
  } catch (e) {
    console.error("save project failed", e);
    return { error: "Could not save. Check the connection and try again.", at: Date.now() };
  }
  refresh([slug]);
  await logActivity(`${existing ? "Updated" : "Added"} project “${p.title}”`);
  if (p.visible) await announce(["/work", `/work/${slug}`]);
  if (!existing) redirect(`/admin/work/${slug}?done=created`);
  return { ok: p.visible ? "Saved. The website is updated." : "Saved. It stays hidden from the website.", at: Date.now() };
}

export async function removeProject(f: FormData) {
  if (!(await allowed("work"))) redirect("/admin/login");
  const slug = text(f, "slug");
  const p = await getAnyProject(slug);
  if (!p || !dbConfigured()) redirect("/admin/work");
  await pruneMedia(await deleteProject(slug));
  refresh([slug]);
  await logActivity(`Deleted project “${p.title}”`);
  redirect("/admin/work?done=deleted&name=" + encodeURIComponent(p.title));
}

export async function toggleProject(slug: string, visible: boolean): Promise<Result> {
  if (!(await allowed("work"))) return { error: "You are signed out, or your role does not allow this." };
  if (!dbConfigured()) return { error: NO_DB };
  try { await setProjectVisible(slug, visible); } catch { return { error: "Could not change that. Try again." }; }
  refresh([slug]);
  await logActivity(`${visible ? "Showed" : "Hid"} project ${slug}`);
  return { ok: visible ? "Showing on the website." : "Hidden from the website." };
}

export async function saveProjectOrder(slugs: string[]): Promise<Result> {
  if (!(await allowed("work"))) return { error: "You are signed out, or your role does not allow this." };
  if (!dbConfigured()) return { error: NO_DB };
  try { await reorderProjects(slugs.slice(0, 500)); } catch { return { error: "Could not save the new order. Try again." }; }
  refresh();
  await logActivity("Changed the order of projects");
  return { ok: "Order saved. The website shows them in this order." };
}
