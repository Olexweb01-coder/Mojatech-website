import { sql } from "@/lib/store";
import { hashPassword, type Role } from "@/lib/admin-auth";

/* The people who can sign in to the admin. */

export type Member = {
  id: string; name: string; email: string; role: Role; active: boolean; mustChange: boolean;
  lastLogin: string | null; lastSeen: string | null; createdAt: string;
};

type Row = { id: string; name: string; email: string; role: Role; active: boolean; must_change: boolean; last_login_at: Date | null; last_seen: Date | null; created_at: Date };

export async function listMembers(): Promise<Member[]> {
  const rows = await sql<Row>(
    `SELECT u.*, (SELECT max(last_seen_at) FROM sessions s WHERE s.user_id = u.id) AS last_seen
       FROM users u ORDER BY u.active DESC, (u.role = 'owner') DESC, u.name`);
  return rows.map((r) => ({
    id: String(r.id), name: r.name, email: r.email, role: r.role, active: r.active, mustChange: r.must_change,
    lastLogin: r.last_login_at?.toISOString() ?? null, lastSeen: r.last_seen?.toISOString() ?? null, createdAt: r.created_at.toISOString(),
  }));
}

export async function getMember(id: string) {
  if (!/^\d{1,18}$/.test(id)) return undefined;
  return (await listMembers()).find((m) => m.id === id);
}

export async function emailTaken(email: string, exceptId?: string) {
  const r = await sql<{ id: string }>("SELECT id FROM users WHERE email = $1", [email]);
  return Boolean(r[0] && String(r[0].id) !== exceptId);
}

export async function addMember(m: { name: string; email: string; role: Role; password: string; mustChange: boolean }) {
  const r = await sql<{ id: string }>(
    "INSERT INTO users (name, email, password_hash, role, must_change) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    [m.name, m.email, await hashPassword(m.password), m.role, m.mustChange]);
  return String(r[0].id);
}

/** Active owners other than this person: there must always be at least one. */
export async function otherOwners(exceptId: string | null) {
  const r = await sql<{ n: string }>("SELECT count(*)::text AS n FROM users WHERE role = 'owner' AND active AND id::text <> $1", [exceptId ?? ""]);
  return Number(r[0].n);
}

export async function setRole(id: string, role: Role) {
  await sql("UPDATE users SET role = $2 WHERE id = $1", [id, role]);
}

export async function setActive(id: string, active: boolean) {
  await sql("UPDATE users SET active = $2 WHERE id = $1", [id, active]);
  if (!active) await sql("DELETE FROM sessions WHERE user_id = $1", [id]);
}

export async function setPassword(id: string, password: string, mustChange: boolean, keepSession?: string | null) {
  await sql("UPDATE users SET password_hash = $2, must_change = $3 WHERE id = $1", [id, await hashPassword(password), mustChange]);
  /* A new password signs the person out everywhere else. */
  await sql("DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2", [id, keepSession ?? ""]);
}

export async function setName(id: string, name: string) {
  await sql("UPDATE users SET name = $2 WHERE id = $1", [id, name]);
}

export async function passwordHashOf(id: string) {
  return (await sql<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = $1", [id]))[0]?.password_hash || "";
}

export async function removeMember(id: string) {
  await sql("DELETE FROM users WHERE id = $1", [id]);
}

export async function signOutOthers(userId: string | null, keep: string | null) {
  if (userId) await sql("DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2", [userId, keep ?? ""]);
  else await sql("DELETE FROM sessions WHERE master AND token_hash <> $1", [keep ?? ""]);
}

export async function recentActivity(limit = 40) {
  const rows = await sql<{ actor: string; action: string; at: Date }>("SELECT actor, action, at FROM activity ORDER BY at DESC LIMIT $1", [limit]);
  return rows.map((r) => ({ actor: r.actor, action: r.action, at: r.at.toISOString() }));
}

export const cleanEmail = (e: string) => e.trim().toLowerCase().slice(0, 160);
export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
export const PASSWORD_MIN = 10;
