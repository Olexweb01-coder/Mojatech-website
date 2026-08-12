import Link from "next/link";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Reveal from "@/components/Reveal";
import IntroSequence from "@/components/IntroSequence";
import ServiceMap from "@/components/ServiceMap";
import SectionHeading from "@/components/SectionHeading";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import Motif from "@/components/Motif";
import CTASection from "@/components/CTASection";
import { services } from "@/lib/data/services";
import { projects } from "@/lib/data/projects";
import { articles } from "@/lib/data/insights";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title:
    "MOJATECH Electrical Enterprises | Electrical, Solar, Security & Facility Solutions in Lagos",
  description:
    "MOJATECH delivers electrical engineering, solar power, security, safety, consultancy and building facility solutions in Lagos, Nigeria — engineered for reliability, efficiency and performance.",
  path: "/",
});

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

const heroLabels: { text: string; cls: string }[] = [
  { text: "Power system", cls: "left-2 top-6" },
  { text: "Safety", cls: "right-2 top-1/4" },
  { text: "Control", cls: "left-4 bottom-1/3" },
  { text: "Energy", cls: "right-6 bottom-10" },
];

const principles = [
  {
    title: "Engineering thinking",
    body: "Every job — from a single panel to a whole facility — is approached as a system to be designed, not a task to be rushed.",
  },
  {
    title: "Safety",
    body: "Electrical work done wrong is dangerous long after the installer leaves. Safe practice is the baseline, not a feature.",
  },
  {
    title: "Reliability",
    body: "Systems are built to keep working under real Lagos conditions — heat, load and imperfect supply included.",
  },
  {
    title: "Technical honesty",
    body: "Recommendations are sized to your actual need. If a smaller system solves the problem, that is what gets recommended.",
  },
  {
    title: "Responsiveness",
    body: "Buildings do not fail on schedule. When something needs attention, the response matches the urgency.",
  },
  {
    title: "Long-term support",
    body: "Installation is the beginning of the relationship, not the end. Systems are maintained, not abandoned.",
  },
];

export default function HomePage() {
  const featuredProjects = projects.slice(0, 3);
  const featuredArticles = articles.slice(0, 3);

  return (
    <>
      {/* ---------------------------------------------------------- HERO */}
      <section className="relative flex min-h-[100svh] items-center overflow-hidden pb-16 pt-32 sm:pt-36">
        <div className="grid-bg pointer-events-none absolute inset-0" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 top-1/3 h-[480px] w-[480px] rounded-full bg-brand-red/15 blur-[160px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 bottom-0 h-[480px] w-[480px] rounded-full bg-brand-blue/20 blur-[160px]"
        />

        {/* Animated electrical spine behind the composition */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <path
            d="M-20 640 H320 V420 H760 M760 420 H1120 V220 H1500"
            stroke="rgba(244,245,247,0.08)"
            strokeWidth="1.5"
          />
          <path
            d="M-20 640 H320 V420 H760 M760 420 H1120 V220 H1500"
            stroke="#C8102E"
            strokeWidth="1.5"
            className="current current--slow"
          />
          <circle cx="320" cy="420" r="4" fill="#C8102E" className="node-pulse" />
          <circle cx="1120" cy="220" r="4" fill="#5A5FF0" className="node-pulse" />
        </svg>

        <div className="shell relative grid items-center gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="label-tech anim-rise" style={d(100)}>
              Electrical · Solar · Security · Facility — Lagos, Nigeria
            </p>
            <h1 className="display mt-6 text-[13vw] leading-[0.95] sm:text-6xl lg:text-7xl xl:text-8xl">
              <span className="anim-mask block" style={d(220)}>Powering systems.</span>
              <span className="anim-mask block text-brand-redBright" style={d(400)}>
                Protecting spaces.
              </span>
              <span className="anim-mask block" style={d(580)}>Building reliability.</span>
            </h1>
            <p className="anim-rise mt-7 max-w-xl text-base leading-relaxed text-steel sm:text-lg" style={d(760)}>
              MOJATECH delivers electrical engineering, solar power, security, safety,
              consultancy and building facility solutions designed around reliability,
              efficiency and performance.
            </p>
            <div className="anim-rise mt-9 flex flex-wrap gap-4" style={d(900)}>
              <Link href="/contact" className="btn-primary" data-cursor="Connect">
                Request a consultation <span className="btn-arrow">→</span>
              </Link>
              <Link href="/services" className="btn-ghost" data-cursor="Explore">
                Explore our services
              </Link>
            </div>
          </div>

          {/* Layered engineering composition */}
          <div className="anim-rise relative lg:col-span-5" style={d(700)}>
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute -inset-6 h-[calc(100%+48px)] w-[calc(100%+48px)]"
              viewBox="0 0 400 420"
              fill="none"
            >
              <rect x="14" y="14" width="372" height="392" stroke="rgba(90,95,240,0.35)" strokeWidth="1" strokeDasharray="6 8" />
              <path d="M14 110 H386 M110 14 V406" stroke="rgba(244,245,247,0.08)" />
            </svg>
            <div className="anim-mask" style={d(860)}>
              <ImagePlaceholder
                label="Electrical Infrastructure / Solar Installation Hero Image"
                ratio="aspect-[4/5]"
              />
            </div>
            {heroLabels.map((l, i) => (
              <span
                key={l.text}
                className={`label-tech label-tech--plain anim-rise absolute border border-line bg-ink/85 px-2.5 py-1.5 ${l.cls}`}
                style={d(1000 + i * 130)}
              >
                <span className={i % 2 ? "text-brand-blueBright" : "text-brand-redBright"}>▪</span>{" "}
                {l.text}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="anim-rise absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 sm:flex"
          style={d(1400)}
          aria-hidden="true"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-steel">Scroll</span>
          <span className="relative h-10 w-px overflow-hidden bg-line">
            <span className="absolute left-0 top-0 h-4 w-px animate-[scan-y_1.8s_ease-in-out_infinite] bg-brand-red" />
          </span>
        </div>
      </section>

      {/* ------------------------------------------------ INTRO SEQUENCE */}
      <IntroSequence />

      {/* --------------------------------------------------- WHAT WE DO */}
      <section className="relative border-t border-line py-24 sm:py-32" id="services">
        <div className="shell">
          <SectionHeading
            eyebrow="What we do"
            title="Systems, not side jobs."
            lead="Six connected disciplines, one engineering standard. Each service is delivered by a team that understands how it affects everything else in the building."
          />

          <div className="mt-16 space-y-6">
            {services.map((s, i) => (
              <Reveal key={s.slug} delay={i * 60}>
                <Link
                  href={`/services/${s.slug}`}
                  data-cursor="Explore"
                  className="group grid items-center gap-8 border border-line bg-panel/60 p-6 transition-colors duration-300 hover:border-paper/25 hover:bg-panel sm:p-8 lg:grid-cols-12"
                >
                  <div className="lg:col-span-7">
                    <p className="label-tech label-tech--plain text-steel/80">{s.navLabel} system</p>
                    <h3 className="display mt-3 text-3xl transition-colors duration-300 group-hover:text-brand-redBright sm:text-4xl">
                      {s.name}
                    </h3>
                    <p className="mt-4 max-w-xl text-sm leading-relaxed text-steel sm:text-base">
                      {s.short}
                    </p>
                    <span className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-paper/80">
                      Explore service <span className="btn-arrow">→</span>
                    </span>
                  </div>
                  <div className="hidden opacity-80 transition-opacity duration-300 group-hover:opacity-100 lg:col-span-5 lg:block">
                    <Motif kind={s.motif} />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- SYSTEM MAP */}
      <section className="relative overflow-hidden border-t border-line py-24 sm:py-32">
        <div className="grid-bg-fine pointer-events-none absolute inset-0 opacity-60" />
        <div className="shell relative">
          <SectionHeading
            eyebrow="The MOJATECH system"
            tone="blue"
            title="Everything connects here."
            lead="Hover, tap or tab through the nodes — every discipline routes back to one accountable technical partner."
          />
          <div className="mt-16">
            <ServiceMap />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- TRUST */}
      <section className="relative border-t border-line py-24 sm:py-32">
        <div className="shell">
          <SectionHeading
            eyebrow="Why MOJATECH"
            title="Engineered for confidence."
            lead="No inflated numbers, no borrowed badges — just the working principles behind every MOJATECH project."
          />
          <div className="mt-16 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {principles.map((p, i) => (
              <Reveal key={p.title} delay={(i % 3) * 90} className="bg-ink">
                <div className="group h-full p-7 transition-colors duration-300 hover:bg-panel sm:p-8">
                  <span
                    aria-hidden="true"
                    className="block h-1.5 w-1.5 rounded-full bg-brand-red shadow-[0_0_8px_rgba(200,16,46,0.8)] transition-transform duration-300 group-hover:scale-150"
                  />
                  <h3 className="display mt-5 text-xl sm:text-2xl">{p.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-steel">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- PROJECTS */}
      <section className="relative border-t border-line py-24 sm:py-32">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Delivered work"
              title="Projects."
              lead="A growing archive of MOJATECH installations across Lagos. Project records below are editable templates until real case studies are published."
            />
            <Reveal delay={200}>
              <Link href="/projects" className="btn-ghost" data-cursor="View">
                All projects <span className="btn-arrow">→</span>
              </Link>
            </Reveal>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {featuredProjects.map((p, i) => (
              <Reveal key={p.slug} delay={i * 100}>
                <Link
                  href={`/projects/${p.slug}`}
                  data-cursor="View project"
                  className="group block border border-line bg-panel/50 transition-colors duration-300 hover:border-paper/25"
                >
                  <ImagePlaceholder label={p.imageLabel} ratio="aspect-[4/3]" />
                  <div className="p-6">
                    <p className="label-tech label-tech--plain text-steel/80">
                      {p.category} · {p.location}
                    </p>
                    <h3 className="display mt-3 text-xl transition-colors group-hover:text-brand-redBright">
                      {p.name}
                    </h3>
                    {p.placeholder && (
                      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-brand-blueBright">
                        Editable template — replace with a real project
                      </p>
                    )}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- INSIGHTS */}
      <section className="relative border-t border-line py-24 sm:py-32">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Insights"
              tone="blue"
              title="Technical thinking, written down."
              lead="Practical guidance on electrical systems, solar power and building protection — written for building owners, not engineers."
            />
            <Reveal delay={200}>
              <Link href="/insights" className="btn-ghost" data-cursor="View">
                All insights <span className="btn-arrow">→</span>
              </Link>
            </Reveal>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {featuredArticles.map((a, i) => (
              <Reveal key={a.slug} delay={i * 100}>
                <Link
                  href={`/insights/${a.slug}`}
                  data-cursor="View"
                  className="group flex h-full flex-col border border-line bg-panel/50 p-7 transition-colors duration-300 hover:border-paper/25"
                >
                  <p className="label-tech label-tech--plain text-steel/80">
                    {a.category} · {a.readingTime}
                  </p>
                  <h3 className="display mt-4 text-xl leading-tight transition-colors group-hover:text-brand-blueBright">
                    {a.title}
                  </h3>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-steel">{a.excerpt}</p>
                  <span className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-paper/80">
                    Read article →
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- FINAL CTA */}
      <CTASection />
    </>
  );
}
