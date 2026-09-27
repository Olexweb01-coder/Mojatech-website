import { redirect } from "next/navigation";
import { isSignedIn, signOut } from "./actions";
import { listProducts, dbConfigured } from "@/lib/store";
import { naira } from "@/lib/data/products";
import ProductForm from "./ProductForm";
import Tools from "./Tools";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Admin() {
  if (!(await isSignedIn())) redirect("/admin/login");
  const products = await listProducts();
  const connected = dbConfigured();

  return (
    <section className="adm-shell wide">
      <header className="adm-top">
        <div>
          <p className="kicker">MOJATECH</p>
          <h1 className="h2">Products</h1>
        </div>
        <form action={signOut}><button className="btn btn-line btn-sm" type="submit">Sign out</button></form>
      </header>

      {!connected && (
        <p className="adm-warn">
          No database is connected, so the list below is the samples and nothing can be saved yet.
          Add <b>DATABASE_URL</b> in Vercel (Settings → Environment Variables) and redeploy.
        </p>
      )}

      <Tools count={products.length} connected={connected} />

      <div className="adm-grid">
        <div>
          <h2 className="h3">Add a product</h2>
          <ProductForm />
        </div>
        <div>
          <h2 className="h3">{products.length} live</h2>
          <ul className="adm-list">
            {products.map((p) => (
              <li key={p.slug}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt="" />
                <div>
                  <b>{p.name}</b>
                  <span>{p.category} · {naira(p.price)}{p.was ? ` (was ${naira(p.was)})` : ""}</span>
                  <a href={"/products/" + p.slug} target="_blank" rel="noreferrer">View page</a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
