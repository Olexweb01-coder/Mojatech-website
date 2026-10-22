import { guard } from "../../guard";
import { ownerKey, getChat, getMessages, deleteChat, updateChat } from "@/lib/arik/store";
import { logActivity } from "@/lib/admin-auth";

/* One chat: read it (anyone on the team), rename, pin or move it to a project
   (anyone), delete it (its author or an owner). */

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if (g.error) return g.error;
  const id = (await params).id;
  const chat = await getChat(id);
  if (!chat) return Response.json({ error: "Not found." }, { status: 404 });
  return Response.json({ chat, messages: await getMessages(id) });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if (g.error) return g.error;
  const id = (await params).id;
  if (!(await getChat(id))) return Response.json({ error: "Not found." }, { status: 404 });
  const b = await req.json().catch(() => ({})) as { title?: string; pinned?: boolean; projectId?: string | null };
  await updateChat(id, {
    title: typeof b.title === "string" && b.title.trim() ? b.title.trim() : undefined,
    pinned: typeof b.pinned === "boolean" ? b.pinned : undefined,
    projectId: b.projectId === undefined ? undefined : b.projectId,
  });
  return Response.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if (g.error) return g.error;
  const id = (await params).id;
  const chat = await getChat(id);
  if (!chat) return Response.json({ ok: true });
  if (chat.author !== ownerKey(g.me) && g.me.role !== "owner") return Response.json({ error: "Only the person who started this chat, or an owner, can delete it." }, { status: 403 });
  await deleteChat(id);
  await logActivity(`Deleted the Arik chat “${chat.title}”`);
  return Response.json({ ok: true });
}
