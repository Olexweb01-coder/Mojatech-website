import { randomBytes } from "crypto";
import { sql, kvGet, kvSet } from "@/lib/store";
import type { Me } from "@/lib/admin-auth";

/* Arik's memory: each person's conversations and the files they shared.
 * Private: one person never sees another's chats. */

export const ownerKey = (me: Me) => (me.id ? `u${me.id}` : "master");

export type FileRef = { id: string; name: string; kind: "image" | "doc"; chars?: number };
export type StoredMessage = { id: string; role: "user" | "assistant"; content: string; files: FileRef[]; meta: { provider?: string } };

/* ---------- Settings (the assistant's name) ---------- */

export type ArikSettings = { name: string };
export async function getArikSettings(): Promise<ArikSettings> {
  const s = await kvGet<Partial<ArikSettings>>("arik").catch(() => undefined);
  return { name: (s?.name || "Arik").slice(0, 24) };
}
export async function setArikSettings(s: ArikSettings) {
  await kvSet("arik", s);
}

/* ---------- Chats ---------- */

export async function listChats(owner: string) {
  const rows = await sql<{ id: string; title: string; updated_at: Date }>(
    "SELECT id, title, updated_at FROM arik_chats WHERE owner = $1 ORDER BY updated_at DESC LIMIT 100", [owner]);
  return rows.map((r) => ({ id: String(r.id), title: r.title, updatedAt: r.updated_at.toISOString() }));
}

export async function ownsChat(owner: string, id: string) {
  if (!/^\d{1,18}$/.test(id)) return false;
  return (await sql("SELECT 1 FROM arik_chats WHERE id = $1 AND owner = $2", [id, owner])).length > 0;
}

export async function createChat(owner: string, title: string) {
  const r = await sql<{ id: string }>("INSERT INTO arik_chats (owner, title) VALUES ($1, $2) RETURNING id", [owner, title.slice(0, 80) || "New chat"]);
  return String(r[0].id);
}

export async function renameChat(id: string, title: string) {
  await sql("UPDATE arik_chats SET title = $2 WHERE id = $1", [id, title.slice(0, 80)]);
}

export async function deleteChat(owner: string, id: string) {
  await sql("DELETE FROM arik_chats WHERE id = $1 AND owner = $2", [id, owner]);
}

export async function getMessages(chatId: string): Promise<StoredMessage[]> {
  const rows = await sql<{ id: string; role: "user" | "assistant"; content: string; files: FileRef[]; meta: { provider?: string } }>(
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

export async function getFiles(owner: string, ids: string[]) {
  if (!ids.length) return [];
  return sql<{ id: string; name: string; mime: string; kind: "image" | "doc"; text: string; bytes: Buffer | null }>(
    "SELECT id, name, mime, kind, text, bytes FROM arik_files WHERE owner = $1 AND id = ANY($2::text[])", [owner, ids.filter((i) => /^[a-f0-9]{24}$/.test(i))]);
}
