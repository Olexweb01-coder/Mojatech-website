import Link from "next/link";
import Film from "@/components/home/Film";
import { Ctas } from "@/components/site/Bits";
import { work, process, why, company } from "@/lib/data/company";
import { meta } from "@/lib/seo";

export const metadata = meta({
  title: "MOJATECH | Electrical, solar and security in Nigeria",
  description: "Electrical installation, solar and inverter backup, CCTV and industrial power for homes and businesses across Nigeria. CAC registered since 2019.",
  path: "/",
});

export default function Home() {
  return (
    <>
      <Film />

      <section className="sec work-strip" id="work-strip" aria-labelledby="t-work">
        <div className="wrap sec-head">
          <p className="kicker">Our work</p>
          <h2 className="h2" id="t-work">Trusted on real sites.</h2>
          <p className="lead">Electrical, solar and inverter projects delivered for homes, offices and industry.</p>
        </div>
        <ul className="track" style={{ marginTop: 44 }}>
          {work.map((w, i) => (
            <li key={w.title}>
              <figure className={"card" + (i === 0 ? " card--wide" : "")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={w.img} alt={w.alt} loading="lazy" />
                <figcaption><b>{w.title}</b><span>{w.type}</span></figcaption>
              </figure>
            </li>
          ))}
        </ul>
        <div className="wrap" style={{ marginTop: 34 }}><Link className="link" href="/work">See all projects</Link></div>
      </section>

      <section className="sec dark" id="how" aria-labelledby="t-how">
        <div className="wrap sec-head">
          <p className="kicker">How we work</p>
          <h2 className="h2" id="t-how">Six steps. Every job.</h2>
          <p className="lead">The same process whether it is one room or a full site.</p>
        </div>
        <div className="wrap flow">
          <span className="flow-line"><i /></span>
          <ol>{process.map(([t, d], i) => (
            <li key={t}><span className="n">{i + 1}</span><h3>{t}</h3><p>{d}</p></li>
          ))}</ol>
        </div>
      </section>

      <section className="sec tint" aria-label="Why MOJATECH">
        <div className="wrap"><ul className="why">{why.map((w) => <li key={w}>{w}</li>)}</ul></div>
      </section>

      <section className="finale" id="start" aria-labelledby="t-start">
        <div className="fin-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/stock/lagos-night.webp" alt="Victoria Island, Lagos, lit up at night" loading="lazy" />
        </div>
        <div className="fin-dark" />
        <div className="fin-copy">
          <p className="kicker">Let&apos;s get started</p>
          <h2 className="h2" id="t-start">Ready to switch on?</h2>
          <p className="lead">Tell us what you need. We&apos;ll take it from there.</p>
          <Ctas secondary={["Call " + company.contact.phoneDisplay, "tel:" + company.contact.phone]} light />
          <p className="sign">MOJATECH. {company.tagline}</p>
        </div>
      </section>
    </>
  );
}
