import { redirect } from "next/navigation";
import { isSignedIn } from "@/lib/admin-auth";
import { sql, dbConfigured } from "@/lib/store";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function Login() {
  if (await isSignedIn()) redirect("/admin");
  const hasAccounts = dbConfigured()
    ? Number((await sql<{ n: string }>("SELECT count(*)::text AS n FROM users WHERE active").catch(() => [{ n: "0" }]))[0].n) > 0
    : false;
  return (
    <section className="mja-login">
      <div className="mja-login-card">
        <span className="mja-plate">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/mojatech-mark.png" alt="MOJATECH" width={480} height={253} />
        </span>
        <h1>MOJATECH Admin</h1>
        <p>{hasAccounts ? "Sign in with your email and password." : "Sign in with the admin password."}</p>
        <LoginForm hasAccounts={hasAccounts} />
      </div>
    </section>
  );
}
