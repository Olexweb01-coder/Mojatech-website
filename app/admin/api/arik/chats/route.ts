import { guard } from "../guard";
import { ownerKey, listChats, listProjects, createProject } from "@/lib/arik/store";
import { logActivity } from "@/lib/admin-auth";

/* Every chat and project, for the whole team. */
export async function GET(req: Request) {
  const g = await guard(req);
  if (g.error) return g.error;
  const [chats, projects] = await Promise.all([listChats(), listProjects()]);
  return Response.json({ me: ownerKey(g.me), owner: g.me.role === "owner", chats, projects });
}

/* A new project. */
export async function POST(req: Request) {
  const g = await guard(req);
  if (g.error) return g.error;
  const { name } = await req.json().catch(() => ({})) as { name?: string };
  const n = String(name || "").trim().slice(0, 60);
  if (!n) return Response.json({ error: "Give the project a name." }, { status: 400 });
  const id = await createProject(n, ownerKey(g.me));
  await logActivity(`Created the Arik project “${n}”`);
  return Response.json({ id });
}
