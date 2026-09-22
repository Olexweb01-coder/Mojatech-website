import { Hero, Ctas, WA } from "@/components/site/Bits";
import PageMotion from "@/components/site/PageMotion";
import { CareersForm } from "@/components/forms/Forms";
import { company } from "@/lib/data/company";
import { meta } from "@/lib/seo";

export const metadata = meta({
  title: "Careers: internship, apprenticeship, NYSC and SIWES placements",
  description: "MOJATECH takes on interns, apprentices, NYSC members and industrial training (SIWES) students, and teaches them on live electrical, solar and security jobs across Nigeria.",
  path: "/careers", image: "/work/flour-mills-electrical.jpg",
});

const PROGRAMMES: [string, string, string][] = [
  ["Internship", "For students and graduates who want site experience in electrical and solar work.", "Apply any time"],
  ["Apprenticeship", "Learn the trade properly, on real installations, under people who do it every day.", "Places depend on projects"],
  ["NYSC placement", "Serve your year with a registered electrical company and leave with a real skill.", "Batch A and B"],
  ["Industrial training (SIWES)", "Complete your IT placement on live electrical, solar and security jobs.", "Logbook signed"],
];
const LEARN = ["Conduit and surface wiring", "Distribution boards and protection", "Solar panels, inverters and batteries",
  "CCTV, intercoms and cabling", "Testing, fault finding and safety", "Site conduct and working with clients"];

export default function Careers() {
  return (
    <>
      <PageMotion kind="careers" />
      <Hero kicker="Careers" head="Learn the trade on real sites."
        lead="MOJATECH takes on interns, apprentices, NYSC members and industrial training students, and teaches them on live jobs, not on paper."
        img="/work/flour-mills-electrical.jpg" pos="50% 45%"
        ctas={<div className="ctas"><a className="btn btn-red" href="#apply">Apply now</a><a className="btn btn-light" href="/about">About MOJATECH</a></div>} />

      <section className="sec">
        <div className="wrap sec-head">
          <p className="kicker">Programmes</p>
          <h2 className="h2">Four ways to join us.</h2>
          <p className="lead">Every place depends on the projects running at the time, so tell us when you are available.</p>
        </div>
        <div className="wrap progs">
          {PROGRAMMES.map(([t, d, tag]) => (
            <article className="prog" key={t}><b>{t}</b><p>{d}</p><p className="tagline">{tag}</p></article>
          ))}
        </div>
      </section>

      <section className="sec dark">
        <div className="wrap grid-2">
          <div>
            <p className="kicker">What you will learn</p>
            <h2 className="h2">Skills you can use the day you leave.</h2>
            <p className="lead" style={{ marginTop: 18 }}>You will work beside our technicians on real installations, not watch from a corner.</p>
            <Ctas primary="Talk to us" secondary={["WhatsApp us", WA]} light />
          </div>
          <div><ul className="why">{LEARN.map((l) => <li key={l}>{l}</li>)}</ul></div>
        </div>
      </section>

      <section className="sec tint" id="apply">
        <div className="wrap grid-2">
          <div>
            <p className="kicker">Apply</p>
            <h2 className="h2">Send your details.</h2>
            <p className="lead" style={{ marginTop: 16 }}>Tell us which programme you want, your school or institution, and when you can start. If nothing is open now, we keep your details for the next intake.</p>
            <div className="cinfo" style={{ marginTop: 26 }}>
              <a href={"mailto:" + company.contact.email}>{company.contact.email}<small>Or send your CV by email</small></a>
              <a href={WA} target="_blank" rel="noopener noreferrer">WhatsApp {company.contact.phoneDisplay}<small>Fastest reply</small></a>
            </div>
          </div>
          <div><CareersForm /></div>
        </div>
      </section>
    </>
  );
}
