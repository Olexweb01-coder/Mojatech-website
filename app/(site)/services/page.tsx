import Link from "next/link";
import { Hero, Ctas, WA } from "@/components/site/Bits";
import PageMotion from "@/components/site/PageMotion";
import { services } from "@/lib/data/services";
import { meta } from "@/lib/seo";

export const metadata = meta({
  title: "Electrical, solar and CCTV services",
  description: "Electrical installation, solar and inverter backup, CCTV, industrial power, maintenance, power audits and automation, anywhere in Nigeria.",
  path: "/services", image: "/stock/services.webp",
});

export default function Services() {
  return (
    <>
      <PageMotion kind="services" />
      <Hero kicker="Services" head="What we install, fix and look after."
        lead="Seven services, one team. Pick what you need, or describe the problem and we will point you to it."
        img="/stock/services.webp" ctas={<Ctas secondary={["Talk on WhatsApp", WA]} light />} />

      <section className="sec">
        <div className="wrap sindex">
          <div className="slist">
            {services.map((s) => (
              <Link className="srow" href={"/services/" + s.id} key={s.id} data-name={s.name}>
                <div>
                  <h2 className="h3">{s.name}</h2>
                  <p>{s.sub}</p>
                  <span className="rowimg">{/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.img} alt="" style={{ objectPosition: s.pos }} loading="lazy" /></span>
                </div>
                <span className="go" aria-hidden="true">&#8594;</span>
              </Link>
            ))}
          </div>
          <figure className="spreview">
            {services.map((s, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={s.id} src={s.img} alt="" className={i ? undefined : "on"} style={{ objectPosition: s.pos }} loading="lazy" />
            ))}
            <figcaption data-preview-cap>{services[0].name}</figcaption>
          </figure>
        </div>
      </section>

      <section className="sec tint">
        <div className="wrap sec-head">
          <p className="kicker">Not sure which you need?</p>
          <h2 className="h2">Describe the problem. We will tell you.</h2>
          <p className="lead">Send a photo of the board, the fault or the building, and we will say what the job involves.</p>
          <Ctas secondary={["WhatsApp us", WA]} />
        </div>
      </section>
    </>
  );
}
