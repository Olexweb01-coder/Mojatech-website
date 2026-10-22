import { randomBytes } from "crypto";
import { sql, kvGet, kvSet } from "@/lib/store";
import type { Me } from "@/lib/admin-auth";

/* Arik's memory: the team's conversations, projects and the files shared in them.
 * Everyone signed in can see every chat; each chat and message shows who wrote it.
 * Only the author (or an owner) can delete a chat. */

export const ownerKey = (me: Me) => (me.id ? `u${me.id}` : "master");

export type FileRef = { id: string; name: string; kind: "image" | "doc"; chars?: number };
export type StoredMessage = { id: string; role: "user" | "assistant"; content: string; files: FileRef[]; meta: { provider?: string; author?: string; authorName?: string } };

/* ---------- Settings (the assistant's name) ---------- */

export type ArikSettings = { name: string };
export async function getArikSettings(): Promise<ArikSettings> {
  const s = await kvGet<Partial<ArikSettings>>("arik").catch(() => undefined);
  return { name: (s?.name || "Arik").slice(0, 24) };
}
export async function setArikSettings(s: ArikSettings) {
  await kvSet("arik", s);
}

/* ---------- Chats (shared by the whole team, each with its author) ---------- */

export type ChatItem = {
  id: string; title: string; updatedAt: string; author: string; authorName: string;
  pinned: boolean; projectId: string | null;
};
export type Project = { id: string; name: string; pinned: boolean; createdBy: string; count: number };

export async function listChats(): Promise<ChatItem[]> {
  /* Chats from before names were stored get their author's current name. */
  const rows = await sql<{ id: string; title: string; updated_at: Date; owner: string; author_name: string; pinned: boolean; project_id: string | null }>(
    `SELECT c.id, c.title, c.updated_at, c.owner, c.pinned, c.project_id,
            COALESCE(NULLIF(c.author_name, ''), u.name, CASE WHEN c.owner = 'master' THEN 'Owner' END, '') AS author_name
       FROM arik_chats c LEFT JOIN users u ON c.owner = 'u' || u.id
      ORDER BY c.pinned DESC, c.updated_at DESC LIMIT 400`);
  return rows.map((r) => ({
    id: String(r.id), title: r.title, updatedAt: r.updated_at.toISOString(), author: r.owner, authorName: r.author_name,
    pinned: r.pinned, projectId: r.project_id ? String(r.project_id) : null,
  }));
}

export async function getChat(id: string) {
  if (!/^\d{1,18}$/.test(id)) return undefined;
  const r = await sql<{ id: string; owner: string; title: string; project_id: string | null }>("SELECT id, owner, title, project_id FROM arik_chats WHERE id = $1", [id]);
  return r[0] ? { id: String(r[0].id), author: r[0].owner, title: r[0].title, projectId: r[0].project_id ? String(r[0].project_id) : null } : undefined;
}

export async function createChat(owner: string, title: string, authorName: string, projectId?: string | null) {
  const r = await sql<{ id: string }>(
    "INSERT INTO arik_chats (owner, title, author_name, project_id) VALUES ($1, $2, $3, $4) RETURNING id",
    [owner, title.slice(0, 80) || "New chat", authorName.slice(0, 80), projectId && /^\d+$/.test(projectId) ? projectId : null]);
  return String(r[0].id);
}

export async function updateChat(id: string, c: { title?: string; pinned?: boolean; projectId?: string | null }) {
  if (c.title !== undefined) await sql("UPDATE arik_chats SET title = $2 WHERE id = $1", [id, c.title.slice(0, 80)]);
  if (c.pinned !== undefined) await sql("UPDATE arik_chats SET pinned = $2 WHERE id = $1", [id, c.pinned]);
  if (c.projectId !== undefined) await sql("UPDATE arik_chats SET project_id = $2 WHERE id = $1", [id, c.projectId && /^\d+$/.test(c.projectId) ? c.projectId : null]);
}

export async function deleteChat(id: string) {
  await sql("DELETE FROM arik_chats WHERE id = $1", [id]);
}

/* ---------- Projects: folders that group related chats ---------- */

export async function listProjects(): Promise<Project[]> {
  const rows = await sql<{ id: string; name: string; pinned: boolean; created_by: string; n: string }>(
    `SELECT p.id, p.name, p.pinned, p.created_by, (SELECT count(*) FROM arik_chats c WHERE c.project_id = p.id)::text AS n
       FROM arik_projects p ORDER BY p.pinned DESC, p.name`);
  return rows.map((r) => ({ id: String(r.id), name: r.name, pinned: r.pinned, createdBy: r.created_by, count: Number(r.n) }));
}

export async function createProject(name: string, by: string) {
  const r = await sql<{ id: string }>("INSERT INTO arik_projects (name, created_by) VALUES ($1, $2) RETURNING id", [name.slice(0, 60), by]);
  return String(r[0].id);
}

export async function updateProject(id: string, p: { name?: string; pinned?: boolean }) {
  if (p.name !== undefined) await sql("UPDATE arik_projects SET name = $2 WHERE id = $1", [id, p.name.slice(0, 60)]);
  if (p.pinned !== undefined) await sql("UPDATE arik_projects SET pinned = $2 WHERE id = $1", [id, p.pinned]);
}

/** Removes the project; its chats are kept and simply leave the project. */
export async function deleteProject(id: string) {
  await sql("DELETE FROM arik_projects WHERE id = $1", [id]);
}

export async function getProjectRow(id: string) {
  if (!/^\d{1,18}$/.test(id)) return undefined;
  return (await sql<{ id: string; created_by: string }>("SELECT id, created_by FROM arik_projects WHERE id = $1", [id]))[0];
}

export async function getMessages(chatId: string): Promise<StoredMessage[]> {
  const rows = await sql<{ id: string; role: "user" | "assistant"; content: string; files: FileRef[]; meta: StoredMessage["meta"] }>(
    "SELECT id, role, content, files, meta FROM arik_messages WHERE chat_id = $1 ORDER BY id", [chatId]);
  return rows.map((r) => ({ ...r, id: String(r.id) }));
}

export async function addMessage(chatId: string, role: "user" | "assistant", content: string, files: FileRef[] = [], meta: Record<string, unknown> = {}) {
  await sql("INSERT INTO arik_messages (chat_id, role, content, files, meta) VALUES ($1, $2, $3, $4, $5)",
    [chatId, role, content, JSON.stringify(files), JSON.stringify(meta)]);
  await sql("UPDATE arik_chats SET updated_at = now() WHERE id = $1", [chatId]);
}

/** Removes the last answer (for "try again"). */
export async function dropLastAssistant(chatId: string) {
  await sql(`DELETE FROM arik_messages WHERE id = (SELECT max(id) FROM arik_messages WHERE chat_id = $1) AND role = 'assistant'`, [chatId]);
}

/* ---------- Files ---------- */

export async function saveFile(owner: string, f: { name: string; mime: string; kind: "image" | "doc"; text: string; bytes: Buffer | null }) {
  const id = randomBytes(12).toString("hex");
  await sql("INSERT INTO arik_files (id, owner, name, mime, kind, text, bytes, size) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
    [id, owner, f.name.slice(0, 160), f.mime, f.kind, f.text, f.bytes, f.bytes?.length || f.text.length]);
  return id;
}

/** Files shared in chats. Like the chats themselves, the whole team can open them. */
export async function getFiles(ids: string[]) {
  if (!ids.length) return [];
  return sql<{ id: string; name: string; mime: string; kind: "image" | "doc"; text: string; bytes: Buffer | null }>(
    "SELECT id, name, mime, kind, text, bytes FROM arik_files WHERE id = ANY($1::text[])", [ids.filter((i) => /^[a-f0-9]{24}$/.test(i))]);
}
