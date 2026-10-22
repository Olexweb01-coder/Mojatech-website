import Link from "next/link";
import { notFound } from "next/navigation";
import PageMotion from "@/components/site/PageMotion";
import ProductGallery from "@/components/site/ProductGallery";
import { Ctas, WA } from "@/components/site/Bits";
import { getProject, listProjects, hasPage } from "@/lib/work";
import { meta, siteUrl, jsonLd } from "@/lib/seo";

/* One project from the work gallery: its photos and its story. */
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProject((await params).slug);
  if (!p) return {};
  return meta({
    title: `${p.title}: ${p.type || "project"}`,
    description: (p.story || `${p.type} by MOJATECH${p.location ? ` in ${p.location}` : ""}.`).slice(0, 155),
    path: `/work/${p.slug}`, image: p.img,
  });
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProject((await params).slug);
  if (!p || !hasPage(p)) notFound();
  const others = (await listProjects()).filter((x) => x.slug !== p.slug).slice(0, 3);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CreativeWork", name: p.title, about: p.type, description: p.story || undefined,
        image: p.photos.map((x) => siteUrl + x), creator: { "@id": siteUrl + "/#business" }, locationCreated: p.location || undefined },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Our work", item: siteUrl + "/work" },
        { "@type": "ListItem", position: 3, name: p.title, item: siteUrl + "/work/" + p.slug } ] },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      <PageMotion kind="plain" />
      <section className="sec pdetail">
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/work">Our work</Link> <span aria-hidden="true">›</span> <span>{p.title}</span>
          </nav>
          <div className="pmain">
            <ProductGallery photos={p.photos} name={p.alt} />
            <div className="pbuy">
              {p.type && <p className="kicker">{p.type}</p>}
              <h1 className="h2">{p.title}</h1>
              {p.location && <p className="lead">{p.location}</p>}
              {p.story && <div className="wstory">{p.story.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}</div>}
              <div className="ctas">
                <Link className="btn btn-red" href="/contact">Get a quote for something similar</Link>
                <a className="btn btn-line" href={WA} target="_blank" rel="noopener noreferrer">WhatsApp us</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {others.length > 0 && (
        <section className="sec tint">
          <div className="wrap sec-head"><p className="kicker">More projects</p><h2 className="h2">Other recent work.</h2></div>
          <div className="wrap">
            <ul className="wgrid">
              {others.map((w) => (
                <li key={w.slug}>
                  <figure className="wcard">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={w.img} alt={w.alt} loading="lazy" />
                    <figcaption><b>{w.title}</b>{w.type && <span> &mdash; {w.type}</span>}</figcaption>
                  </figure>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 28 }}><Ctas secondary={["All projects", "/work"]} /></div>
          </div>
        </section>
      )}
    </>
  );
}
