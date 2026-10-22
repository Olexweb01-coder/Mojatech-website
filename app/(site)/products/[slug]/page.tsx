import Link from "next/link";
import { notFound } from "next/navigation";
import PageMotion from "@/components/site/PageMotion";
import ProductGallery from "@/components/site/ProductGallery";
import OrderButton from "@/components/site/OrderButton";
import { products as samples, naira, saving } from "@/lib/data/products";
import { listProducts, getProduct } from "@/lib/store";
import { company } from "@/lib/data/company";
import { meta, siteUrl, jsonLd } from "@/lib/seo";

export const revalidate = 60;
export const dynamicParams = true;

/* Build the pages for whatever is in the catalogue at build time; anything added
   later from the admin renders on demand and is then kept for a minute. */
export async function generateStaticParams() {
  try {
    const all = await listProducts();
    return all.map((p) => ({ slug: p.slug }));
  } catch {
    return samples.map((p) => ({ slug: p.slug }));
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return meta({ title: "Product not found", description: "That product does not exist.", path: "/products" });
  return meta({
    title: `${p.name} — ${naira(p.price)}`,
    description: `${p.short} ${p.freeDelivery ? "Free delivery. " : ""}Supplied and installed by MOJATECH Electrical Enterprises, Nigeria.`.slice(0, 158),
    path: "/products/" + p.slug,
    image: p.image,
  });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();
  const all = await listProducts();
  const others = all.filter((x) => x.slug !== p.slug).slice(0, 3);
  const order = company.contact.whatsapp + "?text=" + encodeURIComponent(
    `Hello MOJATECH, I would like to order: ${p.name} (${naira(p.price)}). Please tell me the next step.`);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: p.name,
        description: p.description,
        category: p.category,
        image: (p.photos?.length ? p.photos : [p.image]).map((x) => siteUrl + x),
        brand: { "@type": "Brand", name: "MOJATECH Electrical Enterprises" },
        offers: {
          "@type": "Offer",
          url: siteUrl + "/products/" + p.slug,
          price: p.price,
          priceCurrency: "NGN",
          availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          seller: { "@id": siteUrl + "/#business" },
          areaServed: { "@type": "Country", name: company.areaServed },
        },
      },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Products", item: siteUrl + "/products" },
        { "@type": "ListItem", position: 3, name: p.name, item: siteUrl + "/products/" + p.slug } ] },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      <PageMotion kind="plain" />

      <section className="sec pdetail">
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/products">Products</Link> <span aria-hidden="true">›</span> <span>{p.category}</span>
          </nav>

          <div className="pmain">
            <ProductGallery photos={p.photos?.length ? p.photos : [p.image]} name={p.name}
              flag={saving(p) > 0 ? `−${saving(p)}% today` : undefined} />

            <div className="pbuy">
              <p className="kicker">{p.category}</p>
              <h1 className="h2">{p.name}</h1>
              <p className="lead">{p.short}</p>

              <div className="pprice big">
                {naira(p.price)}
                {p.was && <s>{naira(p.was)}</s>}
                {saving(p) > 0 && <b>Save {naira((p.was || 0) - p.price)}</b>}
              </div>
              {p.bonus && <p className="pbonus">{p.bonus}</p>}

              <ul className="ptrust">
                <li>{p.inStock ? "In stock" : "Available to order"}</li>
                {p.freeDelivery && <li>Free delivery</li>}
                <li>Installed and tested by MOJATECH</li>
                <li>NEMSA certified, CAC registered</li>
              </ul>

              <div className="ctas">
                <OrderButton href={order} product={p.name} price={naira(p.price)} />
                <Link className="btn btn-line" href="/contact">Ask a question</Link>
              </div>
              <p className="pnote">Or call {company.contact.phoneDisplay}. We confirm availability and delivery before anything is paid.</p>
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: 56 }}>
            <div>
              <p className="kicker">About this</p>
              <h2 className="h2">What you are buying.</h2>
              <p className="lead" style={{ marginTop: 16 }}>{p.description}</p>
            </div>
            <div>
              <h3 className="h3">What the price covers</h3>
              <ul className="inc">{p.includes.map((i) => <li key={i}>{i}</li>)}</ul>
              <h3 className="h3" style={{ marginTop: 32 }}>Details</h3>
              <table className="pspecs"><tbody>
                {p.specs.map(([k, v]) => <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>)}
              </tbody></table>
            </div>
          </div>
        </div>
      </section>

      <section className="sec tint">
        <div className="wrap sec-head"><p className="kicker">Also available</p><h2 className="h2">Others you may need.</h2></div>
        <div className="wrap pgrid" style={{ marginTop: 36 }}>
          {others.map((o) => (
            <Link className="pcard" href={"/products/" + o.slug} key={o.slug}>
              <span className="pcard-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={o.image} alt={o.name} loading="lazy" />
              </span>
              <span className="pcard-body">
                <span className="pcat">{o.category}</span>
                <h3 className="h3">{o.name}</h3>
                <span className="pprice">{naira(o.price)}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
