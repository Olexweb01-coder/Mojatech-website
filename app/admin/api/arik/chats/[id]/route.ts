import { guard } from "../../guard";
import { ownerKey, ownsChat, getMessages, deleteChat, renameChat } from "@/lib/arik/store";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if (g.error) return g.error;
  const id = (await params).id;
  if (!(await ownsChat(ownerKey(g.me), id))) return Response.json({ error: "Not found." }, { status: 404 });
  return Response.json({ messages: await getMessages(id) });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if (g.error) return g.error;
  await deleteChat(ownerKey(g.me), (await params).id);
  return Response.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if (g.error) return g.error;
  const id = (await params).id;
  if (!(await ownsChat(ownerKey(g.me), id))) return Response.json({ error: "Not found." }, { status: 404 });
  const { title } = await req.json().catch(() => ({})) as { title?: string };
  if (title?.trim()) await renameChat(id, title.trim());
  return Response.json({ ok: true });
}
