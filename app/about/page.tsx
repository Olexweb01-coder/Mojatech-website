import { Hero, Ctas } from "@/components/site/Bits";
import PageMotion from "@/components/site/PageMotion";
import { company, process, why, work } from "@/lib/data/company";
import { meta } from "@/lib/seo";

export const metadata = meta({
  title: "About MOJATECH: electrical and solar engineering since 2019",
  description: "MOJATECH Electrical Enterprises has installed, maintained and backed up power systems since 2019 for homes, businesses and industry across Nigeria. CAC registered, NEMSA certified.",
  path: "/about", image: "/stock/about.webp",
});

const PROMISES: [string, string][] = [
  ["We assess.", "Every job starts with the load your building actually runs, not a price list."],
  ["We design.", "Circuits, cable sizes and protection planned around that load."],
  ["We install.", "Our own team, Grade A cable, neat routes, tested before hand-over."],
  ["We stay.", "Support after hand-over, and maintenance whenever you need it."],
];

export default function About() {
  return (
    <>
      <PageMotion kind="about" />
      <Hero kicker="About us" head="We keep buildings powered, safe and running."
        lead="MOJATECH Electrical Enterprises has installed, maintained and backed up power systems since 2019, for homes, businesses and industry across Nigeria."
        img="/stock/about.webp" pos="50% 58%" ctas={<Ctas secondary={["Our work", "/work"]} light />} />

      <section className="sec promise">
        <div className="wrap">
          <p className="kicker">How we work</p>
          <div className="promise-stack">
            {PROMISES.map(([h, p], i) => (
              <div className="promise-item" data-i={i} key={h}><h2>{h}</h2><p>{p}</p></div>
            ))}
          </div>
          <div className="promise-dots">{PROMISES.map((_, i) => <i key={i} className={i ? undefined : "on"} />)}</div>
        </div>
      </section>

      <section className="sec dark">
        <div className="wrap">
          <div className="counters">
            <div className="counter"><b>2019</b><span>Registered with the Corporate Affairs Commission, {company.registration.number}</span></div>
            <div className="counter"><b data-count="7">0</b><span>Services under one roof, from wiring to automation</span></div>
            <div className="counter"><b data-count="36">0</b><span>States we can work in: anywhere in Nigeria</span></div>
            <div className="counter"><b>NEMSA</b><span>Electrical installation competency, Category C</span></div>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap grid-2">
          <div><p className="kicker">What we believe</p><h2 className="h2">Get the load right, and everything after it is simpler.</h2></div>
          <div>
            <p className="lead">Most electrical problems we are called to fix started as a guess: a cable too small, a board too full, an inverter sized by price instead of need. We would rather measure first and tell you what the job really involves.</p>
            <ul className="why" style={{ marginTop: 26 }}>{why.map((w) => <li key={w}>{w}</li>)}</ul>
          </div>
        </div>
        <div className="wrap strip-wrap">
          <ul className="strip">{work.slice(0, 5).map((w) => (
            <figure key={w.title}>{/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={w.img} alt={w.alt} loading="lazy" /></figure>
          ))}</ul>
        </div>
      </section>

      <section className="sec tint">
        <div className="wrap sec-head">
          <p className="kicker">How every job runs</p>
          <h2 className="h2">Six steps, start to finish.</h2>
        </div>
        <div className="wrap grid-3" style={{ marginTop: 44 }}>
          {process.map(([t, d], i) => <div className="tile" key={t}><h3>{i + 1}. {t}</h3><p>{d}</p></div>)}
        </div>
        <div className="wrap" style={{ marginTop: 44 }}><Ctas secondary={["Careers", "/careers"]} /></div>
      </section>
    </>
  );
}
