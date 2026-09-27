import { redirect } from "next/navigation";
import { isSignedIn } from "../actions";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function Login() {
  if (await isSignedIn()) redirect("/admin");
  return (
    <section className="adm-shell">
      <div className="adm-card">
        <p className="kicker">MOJATECH</p>
        <h1 className="h2">Admin</h1>
        <p className="lead" style={{ marginTop: 10 }}>Sign in to manage products.</p>
        <LoginForm />
      </div>
    </section>
  );
}
