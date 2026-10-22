import { guard } from "../../guard";
import { ownerKey, getFiles } from "@/lib/arik/store";

/* A photo shared in a chat, shown back only to the person who shared it. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if (g.error) return g.error;
  const [f] = await getFiles(ownerKey(g.me), [(await params).id]);
  if (!f?.bytes) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(f.bytes), { headers: { "Content-Type": f.mime, "Cache-Control": "private, max-age=86400" } });
}
