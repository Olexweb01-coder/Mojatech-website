import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import Motif from "@/components/Motif";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import CTASection from "@/components/CTASection";
import { getService, services } from "@/lib/data/services";
import { buildMetadata } from "@/lib/seo";
import { company, siteUrl } from "@/lib/data/company";

interface Params {
  params: { slug: string };
}

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: Params): Metadata {
  const service = getService(params.slug);
  if (!service) return {};
  return buildMetadata({
    title: service.metaTitle,
    description: service.metaDescription,
    path: `/services/${service.slug}`,
  });
}

export default function ServicePage({ params }: Params) {
  const service = getService(params.slug);
  if (!service) notFound();

  const related = service.related
    .map((slug) => getService(slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.metaDescription,
    url: `${siteUrl}/services/${service.slug}`,
    areaServed: { "@type": "City", name: company.location.city },
    provider: { "@id": `${siteUrl}/#organization` },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero
        eyebrow={`${service.navLabel} system — Lagos, Nigeria`}
        title={service.headline}
        lead={service.intro}
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Services", href: "/services" },
          { name: service.name, href: `/services/${service.slug}` },
        ]}
      >
        <div className="flex flex-wrap gap-4">
          <Link href="/contact" className="btn-primary" data-cursor="Connect">
            {service.cta} <span className="btn-arrow">→</span>
          </Link>
          <Link href="/projects" className="btn-ghost" data-cursor="View">
            See related work
          </Link>
        </div>
      </PageHero>

      {/* Diagram + image */}
      <section className="relative py-20 sm:py-28">
        <div className="shell grid items-center gap-10 lg:grid-cols-2">
          <Reveal variant="mask">
            <ImagePlaceholder label={service.imageLabel} ratio="aspect-[4/3]" />
          </Reveal>
          <Reveal variant="right" delay={120}>
            <div className="border border-line bg-panel/40 p-6 sm:p-10">
              <Motif kind={service.motif} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Process flow */}
      {service.process && (
        <section className="relative overflow-hidden border-y border-line py-20 sm:py-24">
          <div className="grid-bg-fine pointer-events-none absolute inset-0 opacity-50" />
          <div className="shell relative">
            <Reveal>
              <p className="label-tech label-tech--blue">How it flows</p>
            </Reveal>
            <ol className="mt-10 flex flex-col gap-0 lg:flex-row lg:items-stretch">
              {service.process.map((step, i) => (
                <Reveal key={step} delay={i * 120} className="flex-1">
                  <li className="relative flex items-center gap-4 py-4 lg:flex-col lg:py-0 lg:text-center">
                    <span className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center">
                      <span className="node-pulse block h-2.5 w-2.5 rounded-full bg-brand-red" style={{ animationDelay: `${i * 0.35}s` }} />
                    </span>
                    <span className="display text-xl sm:text-2xl">{step}</span>
                    {i < service.process!.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="absolute left-[7px] top-9 h-[calc(100%-14px)] w-px bg-gradient-to-b from-brand-red/60 to-line lg:left-auto lg:right-[-50%] lg:top-[7px] lg:h-px lg:w-full lg:bg-gradient-to-r"
                      />
                    )}
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Scope */}
      <section className="relative py-24 sm:py-32">
        <div className="shell">
          <Reveal>
            <p className="label-tech">Scope of work</p>
          </Reveal>
          <Reveal delay={90}>
            <h2 className="display mt-4 max-w-3xl text-4xl sm:text-5xl">
              What this service covers.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-px overflow-hidden border border-line bg-line md:grid-cols-2">
            {service.scope.map((item, i) => (
              <Reveal key={item.title} delay={(i % 2) * 100} className="bg-ink">
                <div className="group h-full p-7 transition-colors duration-300 hover:bg-panel sm:p-9">
                  <span
                    aria-hidden="true"
                    className="block h-1.5 w-1.5 rounded-full bg-brand-blueBright shadow-[0_0_8px_rgba(90,95,240,0.8)] transition-transform duration-300 group-hover:scale-150"
                  />
                  <h3 className="display mt-5 text-2xl">{item.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-steel">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={150}>
            <p className="mt-8 max-w-2xl font-mono text-[11px] uppercase leading-relaxed tracking-[0.16em] text-steel">
              Scope descriptions are editable in <span className="text-paper/70">lib/data/services.ts</span> —
              refine them to match MOJATECH's exact confirmed offering.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Related services */}
      {related.length > 0 && (
        <section className="relative border-t border-line py-20 sm:py-24">
          <div className="shell">
            <Reveal>
              <p className="label-tech label-tech--blue">Connected systems</p>
            </Reveal>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {related.map((r, i) => (
                <Reveal key={r.slug} delay={i * 90}>
                  <Link
                    href={`/services/${r.slug}`}
                    data-cursor="Explore"
                    className="group flex items-center justify-between border border-line bg-panel/50 px-6 py-6 transition-colors hover:border-paper/25"
                  >
                    <div>
                      <span className="display block text-2xl group-hover:text-brand-redBright">
                        {r.name}
                      </span>
                      <span className="mt-1 block text-sm text-steel">{r.short}</span>
                    </div>
                    <span className="btn-arrow text-steel">→</span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <CTASection
        title={`${service.navLabel} project\nin mind?`}
        copy="Describe the building and the goal — MOJATECH will respond with an honest technical view before anything else."
        primaryLabel={service.cta}
      />
    </>
  );
}
