import { guard } from "../../guard";
import { ownerKey, getProjectRow, updateProject, deleteProject } from "@/lib/arik/store";
import { logActivity } from "@/lib/admin-auth";

/* Rename or pin a project (anyone); remove it (its creator or an owner). Removing a
   project never deletes its chats. */

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if (g.error) return g.error;
  const id = (await params).id;
  if (!(await getProjectRow(id))) return Response.json({ error: "Not found." }, { status: 404 });
  const b = await req.json().catch(() => ({})) as { name?: string; pinned?: boolean };
  await updateProject(id, { name: typeof b.name === "string" && b.name.trim() ? b.name.trim() : undefined, pinned: typeof b.pinned === "boolean" ? b.pinned : undefined });
  return Response.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if (g.error) return g.error;
  const id = (await params).id;
  const p = await getProjectRow(id);
  if (!p) return Response.json({ ok: true });
  if (p.created_by !== ownerKey(g.me) && g.me.role !== "owner") return Response.json({ error: "Only the person who made this project, or an owner, can remove it." }, { status: 403 });
  await deleteProject(id);
  await logActivity("Removed an Arik project (its chats were kept)");
  return Response.json({ ok: true });
}
