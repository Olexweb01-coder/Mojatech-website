import Link from "next/link";
import { services } from "@/lib/data/services";
import { company } from "@/lib/data/company";
import FilmMotion from "./FilmMotion";

/** The home film. The markup is plain HTML for speed and for Google; only the motion is code. */
export default function Film() {
  const chapters = services.slice(0, 4);
  return (
    <>
    <FilmMotion />
    <section className="film" id="film" aria-label="What MOJATECH does">
      <div className="stage">
        <article className="ch ch-hero" id="ch-home">
          <div className="ch-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="bld-off" src="/stock/house-off.webp" width={1600} height={1066} alt=""
               fetchPriority="high" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="bld-on" src="/stock/house-on.webp" width={1600} height={1066}
              alt="A two-storey house at dusk with its windows and porch lights on"
               fetchPriority="low" />
            <canvas className="bld-gl" aria-hidden="true" />
          </div>
          <div className="ch-shade" />
          <div className="ch-copy">
            <p className="eyebrow">{company.name}</p>
            <h1 className="h1">Your building, powered and protected.</h1>
            <p>We install, maintain and back up electrical, solar and security systems for homes, businesses and industry across Nigeria.</p>
            <div className="ctas">
              <Link className="btn btn-red" href="/contact">Get a quote</Link>
              <Link className="btn btn-light" href="/work">See our work</Link>
            </div>
            <ul className="trust"><li>Registered since 2019</li><li>NEMSA certified</li><li>Flour Mills NG, NRS and FIRS</li></ul>
          </div>
          <div className="cue" aria-hidden="true"><i />Scroll to switch on</div>
        </article>

        {chapters.map((s) => (
          <article className="ch" id={"ch-" + s.id} key={s.id}>
            <div className="ch-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.img} alt={s.name} style={{ objectPosition: s.pos }} loading="lazy" decoding="async" fetchPriority="low" />
            </div>
            <div className="ch-shade" />
            <div className="ch-copy">
              <p className="kicker">{s.name}</p>
              <h2 className="h2">{s.head}</h2>
              <p>{s.sub}</p>
              <Link className="ch-link" href={"/services/" + s.id}>Explore {s.name.toLowerCase()}</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
    </>
  );
}
