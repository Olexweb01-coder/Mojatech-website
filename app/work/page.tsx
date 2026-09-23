import { Hero, Ctas, WA } from "@/components/site/Bits";
import PageMotion from "@/components/site/PageMotion";
import { work, company } from "@/lib/data/company";
import { meta } from "@/lib/seo";

export const metadata = meta({
  title: "Our work: electrical and solar projects",
  description: "Solar at Ibeshe Road, a full electrical project for Flour Mills NG, inverter work in Ikorodu, and installations for NRS and FIRS Lagos.",
  path: "/work", image: "/work/ibeshe-road-solar.jpg",
});

export default function Work() {
  return (
    <>
      <PageMotion kind="work" />
      <Hero kicker="Our work" head="Real sites. Real installations."
        lead="Projects delivered by MOJATECH and photographed on site by our own team."
        img="/work/ibeshe-road-solar.jpg" ctas={<Ctas secondary={["Services", "/services"]} light />} />

      <section className="sec">
        <div className="wrap">
          <div className="counters">
            <div className="counter"><b data-count="6">0</b><span>Projects shown here</span></div>
            <div className="counter"><b data-count="3">0</b><span>Named clients: {company.clients.join(", ")}</span></div>
            <div className="counter"><b>Solar</b><span>Rooftop solar and inverter installations</span></div>
            <div className="counter"><b>Full builds</b><span>Complete electrical installations on active sites</span></div>
          </div>
          <ul className="wgrid">
            {work.map((w) => (
              <li key={w.title}>
                <figure className="wcard">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={w.img} alt={w.alt} loading="lazy" />
                  <figcaption><b>{w.title}</b><span> &mdash; {w.type}</span></figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sec dark">
        <div className="wrap sec-head">
          <p className="kicker">Your project next</p>
          <h2 className="h2">Tell us what you are building.</h2>
          <p className="lead">Send the details, and we will come back with what the job involves.</p>
          <Ctas secondary={["WhatsApp us", WA]} light />
        </div>
      </section>
    </>
  );
}
