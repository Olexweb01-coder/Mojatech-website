import Link from "next/link";
import { Hero, Ctas, WA } from "@/components/site/Bits";
import PageMotion from "@/components/site/PageMotion";
import { products, categories, naira, saving } from "@/lib/data/products";
import { meta, siteUrl } from "@/lib/seo";

export const metadata = meta({
  title: "Products: inverters, batteries, solar panels and CCTV",
  description: "Inverters, lithium batteries, solar panels, street lights, CCTV kits and stabilisers, supplied and installed by MOJATECH across Nigeria. Prices shown, delivery available.",
  path: "/products", image: "/stock/solar-roof.webp",
});

export default function Products() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "MOJATECH products",
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem", position: i + 1, url: siteUrl + "/products/" + p.slug, name: p.name,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <PageMotion kind="work" />
      <Hero kicker="Products" head="Supplied, installed and tested."
        lead="Inverters, batteries, panels, street lights, cameras and stabilisers. Every price includes the part MOJATECH is known for: the installation done properly."
        img="/stock/solar-roof.webp" ctas={<Ctas primary="Ask about a product" secondary={["WhatsApp us", WA]} light />} />

      <section className="sec">
        <div className="wrap">
          <nav className="pcats" aria-label="Product categories">
            <a href="#all" className="on">All</a>
            {categories.map((c) => <a key={c} href={"#" + c.toLowerCase().replace(/\s/g, "-")}>{c}</a>)}
          </nav>

          <ul className="pgrid" id="all">
            {products.map((p) => (
              <li key={p.slug} id={p.category.toLowerCase().replace(/\s/g, "-")}>
                <Link className="pcard" href={"/products/" + p.slug}>
                  <span className="pcard-img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt={p.name} loading="lazy" />
                    {saving(p) > 0 && <b className="pflag">−{saving(p)}%</b>}
                  </span>
                  <span className="pcard-body">
                    <span className="pcat">{p.category}</span>
                    <h2 className="h3">{p.name}</h2>
                    <span className="psub">{p.short}</span>
                    <span className="pprice">
                      {naira(p.price)}
                      {p.was && <s>{naira(p.was)}</s>}
                    </span>
                    {p.freeDelivery && <span className="pbadge">Free delivery</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sec tint">
        <div className="wrap sec-head">
          <p className="kicker">Not sure which suits you?</p>
          <h2 className="h2">Tell us the load, we will tell you the size.</h2>
          <p className="lead">Sizing by guesswork is why systems disappoint. Send what you want powered and for how long, and we will say exactly what it takes.</p>
          <Ctas primary="Get a quote" secondary={["WhatsApp us", WA]} />
        </div>
      </section>
    </>
  );
}
