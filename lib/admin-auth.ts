import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { sql, dbConfigured } from "@/lib/store";

/* Who is signed in to the admin, and what they may do. Server-only.
 *
 * Each person has their own account (email and password) and a role. A
 * signed-in device holds a random token in a cookie; the database keeps only a
 * fingerprint of it, so a stolen database cannot be used to sign in, and a
 * session can be ended from the server (sign out, remove a person).
 *
 * The master password (ADMIN_PASSWORD in Vercel) still works, with the email
 * left empty. It is how the owner gets in the first time, and the way back in
 * if every account is locked out. */

export const COOKIE = "mj-admin";
export const WEEK = 60 * 60 * 24 * 7;
const SESSION_DAYS = 30;

/* ---------------- Roles ---------------- */

export type Perm = "enquiries" | "products" | "work" | "reviews" | "team";
export type Role = "owner" | "manager" | "sales" | "editor";

export const ROLES: Record<Role, { label: string; hint: string; perms: Perm[] }> = {
  owner:   { label: "Owner",   hint: "Everything, including the team", perms: ["enquiries", "products", "work", "reviews", "team"] },
  manager: { label: "Manager", hint: "Everything except the team",     perms: ["enquiries", "products", "work", "reviews"] },
  sales:   { label: "Sales",   hint: "Enquiries and reviews",          perms: ["enquiries", "reviews"] },
  editor:  { label: "Editor",  hint: "Products, work and reviews",     perms: ["products", "work", "reviews"] },
};
export const isRole = (r: unknown): r is Role => typeof r === "string" && r in ROLES;

export type Me = { id: string | null; name: string; email: string; role: Role; master: boolean; mustChange: boolean };
export const can = (me: Me | null, perm: Perm) => Boolean(me && ROLES[me.role].perms.includes(perm));

/* ---------------- Passwords ---------------- */

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  const key = await scrypt(pw, salt, 64);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function checkPassword(pw: string, stored: string) {
  const [kind, salt, key] = stored.split("$");
  if (kind !== "scrypt" || !salt || !key) return false;
  const got = await scrypt(pw, Buffer.from(salt, "base64"), 64);
  const want = Buffer.from(key, "base64");
  return got.length === want.length && timingSafeEqual(got, want);
}

export function same(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** A temporary password that is easy to read out or type: no 0/O or 1/l. */
export function tempPassword() {
  const abc = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const b = randomBytes(12);
  return Array.from(b, (n) => abc[n % abc.length]).join("").replace(/(.{4})(?!$)/g, "$1-");
}

/* ---------------- Sessions ---------------- */

const secret = () => process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "";
const fingerprint = (token: string) => createHash("sha256").update(token).digest("hex");
const legacySign = (v: string) => createHmac("sha256", secret()).update(v).digest("hex");

/** Signs this device in. Without a database only the master password can be
 *  used, and the cookie is a signed timestamp instead of a database session. */
export async function startSession(userId: string | null, agent: string) {
  const jar = await cookies();
  const opts = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
  if (!dbConfigured()) {
    const issued = String(Date.now());
    jar.set(COOKIE, `${issued}.${legacySign(issued)}`, { ...opts, maxAge: WEEK });
    return;
  }
  const token = randomBytes(32).toString("base64url");
  await sql(
    `INSERT INTO sessions (token_hash, user_id, master, agent, expires_at) VALUES ($1, $2, $3, $4, now() + interval '${SESSION_DAYS} days')`,
    [fingerprint(token), userId, userId === null, agent.slice(0, 200)]);
  jar.set(COOKIE, token, { ...opts, maxAge: SESSION_DAYS * 86400 });
  /* Tidy away long-expired sessions now and then. */
  if (Math.random() < 0.1) void sql("DELETE FROM sessions WHERE expires_at < now()").catch(() => {});
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token && dbConfigured() && !token.includes(".")) await sql("DELETE FROM sessions WHERE token_hash = $1", [fingerprint(token)]).catch(() => {});
  jar.delete(COOKIE);
}

/** Who this request belongs to. Looked up once per request. */
export const getMe = cache(async (): Promise<Me | null> => {
  if (!process.env.ADMIN_PASSWORD && !dbConfigured()) return null;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  if (!dbConfigured()) {
    const [issued, mac] = token.split(".");
    if (!issued || !mac || Number(issued) + WEEK * 1000 < Date.now()) return null;
    try { if (!same(mac, legacySign(issued))) return null; } catch { return null; }
    return { id: null, name: "Owner", email: "", role: "owner", master: true, mustChange: false };
  }

  const rows = await sql<{ master: boolean; id: string | null; name: string | null; email: string | null; role: string | null; active: boolean | null; must_change: boolean | null }>(
    `SELECT s.master, u.id, u.name, u.email, u.role, u.active, u.must_change
       FROM sessions s LEFT JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now()`, [fingerprint(token)]).catch(() => []);
  const r = rows[0];
  if (!r) return null;
  void sql("UPDATE sessions SET last_seen_at = now() WHERE token_hash = $1 AND last_seen_at < now() - interval '10 minutes'", [fingerprint(token)]).catch(() => {});
  if (r.master) return { id: null, name: "Owner", email: "", role: "owner", master: true, mustChange: false };
  if (!r.id || !r.active || !isRole(r.role)) return null;
  return { id: String(r.id), name: r.name || "", email: r.email || "", role: r.role, master: false, mustChange: Boolean(r.must_change) };
});

/** The fingerprint of this device's session, to keep it when signing out the others. */
export async function currentSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  return token && !token.includes(".") ? fingerprint(token) : null;
}

export async function isSignedIn() {
  return Boolean(await getMe());
}

/** For server actions: is the person signed in and allowed to do this? */
export async function allowed(perm?: Perm) {
  const me = await getMe();
  return Boolean(me && (!perm || can(me, perm)));
}

/** Every admin page calls this first. Without permission for the section, it
 *  goes back to the home screen with a short explanation. */
export async function requireAdmin(perm?: Perm): Promise<Me> {
  const me = await getMe();
  if (!me) redirect("/admin/login");
  if (me.mustChange) redirect("/admin/account?first=1");
  if (perm && !can(me, perm)) redirect("/admin?denied=1");
  return me;
}

/* ---------------- Who did what ---------------- */

export async function logActivity(action: string) {
  if (!dbConfigured()) return;
  const me = await getMe().catch(() => null);
  await sql("INSERT INTO activity (actor, action) VALUES ($1, $2)", [me ? (me.master ? "Owner (master password)" : me.name) : "Someone", action.slice(0, 300)]).catch(() => {});
}
