"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sql, dbConfigured } from "@/lib/store";
import { hashIp } from "@/lib/enquiries";
import { same, checkPassword, startSession, endSession, logActivity } from "@/lib/admin-auth";

/* Signing in and out of the admin.
 *
 * Guessing is slowed down after each miss and stopped for 15 minutes after 6,
 * counted both per device and per email address. Kept in the database, so it
 * holds across every server Vercel runs. */

const LOCK_AFTER = 6;
const LOCK_MINUTES = 15;
const memory = new Map<string, { count: number; until: number }>();   /* only when there is no database */

async function locked(keys: string[]) {
  if (!dbConfigured()) return keys.some((k) => (memory.get(k)?.until || 0) > Date.now());
  const rows = await sql<{ n: string }>("SELECT count(*)::text AS n FROM login_attempts WHERE key = ANY($1) AND locked_until > now()", [keys]).catch(() => [{ n: "0" }]);
  return Number(rows[0].n) > 0;
}

async function miss(keys: string[]) {
  let worst = 0;
  for (const k of keys) {
    if (!dbConfigured()) {
      const c = (memory.get(k)?.count || 0) + 1;
      memory.set(k, { count: c, until: c >= LOCK_AFTER ? Date.now() + LOCK_MINUTES * 60000 : 0 });
      worst = Math.max(worst, c);
      continue;
    }
    const rows = await sql<{ count: number }>(
      `INSERT INTO login_attempts (key, count, updated_at) VALUES ($1, 1, now())
       ON CONFLICT (key) DO UPDATE SET
         count = CASE WHEN login_attempts.updated_at < now() - interval '1 hour' THEN 1 ELSE login_attempts.count + 1 END,
         updated_at = now()
       RETURNING count`, [k]).catch(() => [{ count: 1 }]);
    const c = rows[0].count;
    if (c >= LOCK_AFTER) await sql(`UPDATE login_attempts SET locked_until = now() + interval '${LOCK_MINUTES} minutes', count = 0 WHERE key = $1`, [k]).catch(() => {});
    worst = Math.max(worst, c);
  }
  await new Promise((r) => setTimeout(r, 400 + worst * 250));
  return worst >= LOCK_AFTER;
}

async function clear(keys: string[]) {
  if (!dbConfigured()) { keys.forEach((k) => memory.delete(k)); return; }
  await sql("DELETE FROM login_attempts WHERE key = ANY($1)", [keys]).catch(() => {});
}

export async function signIn(_prev: unknown, form: FormData) {
  const email = String(form.get("email") || "").trim().toLowerCase().slice(0, 160);
  const password = String(form.get("password") || "").slice(0, 200);
  const h = await headers();
  const device = "ip:" + hashIp((h.get("x-forwarded-for") || "unknown").split(",")[0].trim());
  const keys = email ? [device, "email:" + email] : [device];
  const tooMany = "Too many attempts. Wait 15 minutes, then try again.";

  if (await locked(keys)) return { error: tooMany };
  if (!password) return { error: "Enter your password." };

  let userId: string | null = null;
  let mustChange = false;
  let ok = false;

  if (!email) {
    /* The master password from Vercel. */
    const master = process.env.ADMIN_PASSWORD || "";
    if (!master) return { error: "Enter your email address." };
    ok = same(password, master);
  } else if (dbConfigured()) {
    const rows = await sql<{ id: string; password_hash: string; active: boolean; must_change: boolean }>(
      "SELECT id, password_hash, active, must_change FROM users WHERE email = $1", [email]).catch(() => []);
    const u = rows[0];
    /* Check a password even when the email is unknown, so the time taken does not reveal which emails exist. */
    const good = await checkPassword(password, u?.password_hash || "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(86) + "==");
    if (u && good && u.active) { ok = true; userId = String(u.id); mustChange = u.must_change; }
    else if (u && good && !u.active) return { error: "This account has been switched off. Ask the owner." };
  }

  if (!ok) {
    const nowLocked = await miss(keys);
    return { error: nowLocked ? tooMany : email ? "That email and password do not match." : "That password is not right." };
  }

  await clear(keys);
  await startSession(userId, h.get("user-agent") || "");
  if (userId) await sql("UPDATE users SET last_login_at = now() WHERE id = $1", [userId]).catch(() => {});
  await logActivity("Signed in");
  redirect(mustChange ? "/admin/account?first=1" : "/admin");
}

export async function signOut() {
  await endSession();
  redirect("/admin/login");
}
