import { guard } from "../guard";
import { ownerKey, listChats } from "@/lib/arik/store";

export async function GET(req: Request) {
  const g = await guard(req);
  if (g.error) return g.error;
  return Response.json({ chats: await listChats(ownerKey(g.me)) });
}
