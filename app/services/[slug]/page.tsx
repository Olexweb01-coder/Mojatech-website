import Link from "next/link";
import { notFound } from "next/navigation";
import { Hero, Ctas, WA } from "@/components/site/Bits";
import PageMotion from "@/components/site/PageMotion";
import { services, serviceById } from "@/lib/data/services";
import { meta, siteUrl, jsonLd } from "@/lib/seo";
import { company } from "@/lib/data/company";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = serviceById(slug);
  if (!s) return meta({ title: "Service not found", description: "That service page does not exist.", path: "/services" });
  return meta({
    title: `${s.name} in Nigeria`,
    description: `${s.sub} MOJATECH: registered since 2019, NEMSA certified.`.slice(0, 158),
    path: "/services/" + s.id, image: s.img,
  });
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = serviceById(slug);
  if (!s) notFound();
  const others = services.filter((x) => x.id !== s.id).slice(0, 3);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Service", name: s.name, serviceType: s.name, description: s.sub,
        provider: { "@id": siteUrl + "/#business" }, areaServed: { "@type": "Country", name: company.areaServed },
        hasOfferCatalog: { "@type": "OfferCatalog", name: s.name + " includes",
          itemListElement: s.includes.map((i) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: i } })) } },
      { "@type": "FAQPage", mainEntity: s.faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Services", item: siteUrl + "/services" },
        { "@type": "ListItem", position: 3, name: s.name, item: siteUrl + "/services/" + s.id } ] },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      <PageMotion kind="service" />
      <Hero kicker={s.name} head={s.head} lead={s.sub} img={s.img} pos={s.pos} ctas={<Ctas secondary={["WhatsApp us", WA]} light />} />

      <section className="sec">
        <div className="wrap grid-2">
          <div>
            <p className="kicker">What this covers</p>
            <h2 className="h2">Included in the job.</h2>
            <p className="lead" style={{ marginTop: 18 }}>Quoted as one job, with no surprise extras once we are on site.</p>
          </div>
          <div><ul className="inc">{s.includes.map((i) => <li key={i}>{i}</li>)}</ul></div>
        </div>
      </section>

      <section className="sec dark stages-sec">
        <div className="wrap sec-head"><p className="kicker">How it runs</p><h2 className="h2">Three stages.</h2></div>
        <div className="stages">
          <div className="stagetrack">
            {s.steps.map(([t, d], i) => (
              <article className="stage-card" key={t}><b>{i + 1}</b><h3>{t}</h3><p>{d}</p></article>
            ))}
            <article className="stage-card"><b>&#10003;</b><h3>Then it is yours</h3><p>Tested, handed over and supported. Call us any time after.</p></article>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap grid-2">
          <div><p className="kicker">Questions</p><h2 className="h2">Answered.</h2></div>
          <div className="faq">{s.faqs.map(([q, a]) => (
            <details key={q}><summary>{q}</summary><p>{a}</p></details>
          ))}</div>
        </div>
      </section>

      <section className="sec tint">
        <div className="wrap sec-head"><p className="kicker">Other services</p><h2 className="h2">You may also need.</h2></div>
        <div className="wrap grid-3" style={{ marginTop: 36 }}>
          {others.map((o) => (
            <Link className="tile" href={"/services/" + o.id} key={o.id} style={{ textDecoration: "none", display: "block" }}>
              <h3>{o.name}</h3><p>{o.sub}</p>
            </Link>
          ))}
        </div>
        <div className="wrap" style={{ marginTop: 40 }}><Ctas secondary={["All services", "/services"]} /></div>
      </section>
    </>
  );
}
