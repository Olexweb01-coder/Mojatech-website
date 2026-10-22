import { getMe } from "@/lib/admin-auth";
import { dbConfigured } from "@/lib/store";

/** Every Arik endpoint: signed in (any role), same site, database connected. */
export async function guard(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return { error: Response.json({ error: "Not allowed." }, { status: 403 }) };
  const me = await getMe();
  if (!me || me.mustChange) return { error: Response.json({ error: "Please sign in again." }, { status: 401 }) };
  if (!dbConfigured()) return { error: Response.json({ error: "Arik needs the database. Add DATABASE_URL to .env.local." }, { status: 503 }) };
  return { me };
}
