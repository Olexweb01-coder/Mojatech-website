import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import CTASection from "@/components/CTASection";
import { getProject, projects } from "@/lib/data/projects";
import { getService } from "@/lib/data/services";
import { buildMetadata } from "@/lib/seo";

interface Params {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return buildMetadata({
    title: `${project.name} — ${project.category} Project | MOJATECH`,
    description: `${project.summary} ${project.category} by MOJATECH in ${project.location}.`,
    path: `/projects/${project.slug}`,
  });
}

const stages = ["challenge", "approach", "solution", "result"] as const;

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const service = getService(project.serviceSlug);

  return (
    <>
      <PageHero
        eyebrow={`${project.category} · ${project.location}`}
        title={project.name}
        lead={project.summary}
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Projects", href: "/projects" },
          { name: project.name, href: `/projects/${project.slug}` },
        ]}
      >
        {project.placeholder && (
          <p className="inline-block border border-brand-blueBright/40 bg-brand-blue/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-brand-blueBright">
            Editable template — replace with a verified MOJATECH project record
          </p>
        )}
      </PageHero>

      <section className="relative py-20 sm:py-28">
        <div className="shell">
          <Reveal variant="mask">
            <ImagePlaceholder label={project.imageLabel} ratio="aspect-[21/9]" />
          </Reveal>

          {/* Facts */}
          <div className="mt-12 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Service", project.category],
              ["Location", project.location],
              ["Completed", project.completed ?? "To be added"],
              ["Client", project.client ?? "Shared only with authorisation"],
            ].map(([k, v], i) => (
              <Reveal key={k} delay={i * 80} className="bg-ink">
                <div className="p-6">
                  <p className="label-tech label-tech--plain text-steel/80">{k}</p>
                  <p className="mt-2 text-sm text-paper/90">{v}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Case study flow */}
          <div className="relative mt-20">
            <div aria-hidden="true" className="absolute left-[7px] top-2 h-[calc(100%-16px)] w-px bg-line" />
            <div
              aria-hidden="true"
              className="absolute left-[7px] top-2 h-[calc(100%-16px)] w-px bg-gradient-to-b from-brand-red to-brand-blueBright opacity-60"
            />
            <div className="space-y-14 pl-10">
              {stages.map((stage, i) => {
                const text = project[stage];
                if (!text) return null;
                return (
                  <Reveal key={stage} delay={i * 60}>
                    <div className="relative">
                      <span
                        aria-hidden="true"
                        className="node-pulse absolute -left-10 top-2 block h-3 w-3 rounded-full bg-brand-red"
                        style={{ animationDelay: `${i * 0.4}s` }}
                      />
                      <h2 className="display text-3xl capitalize sm:text-4xl">{stage}</h2>
                      <p className="mt-4 max-w-2xl text-base leading-relaxed text-steel">{text}</p>
                    </div>
                  </Reveal>
                );
              })}
              {!project.result && (
                <Reveal delay={200}>
                  <p className="max-w-2xl font-mono text-[11px] uppercase leading-relaxed tracking-[0.16em] text-steel">
                    Result is published only when a verified outcome exists — edit{" "}
                    <span className="text-paper/70">lib/data/projects.ts</span> to add one.
                  </p>
                </Reveal>
              )}
            </div>
          </div>

          {service && (
            <Reveal delay={150}>
              <div className="mt-20 flex flex-wrap items-center justify-between gap-6 border border-line bg-panel/50 p-8">
                <div>
                  <p className="label-tech label-tech--blue">Related service</p>
                  <p className="display mt-2 text-2xl">{service.name}</p>
                </div>
                <Link href={`/services/${service.slug}`} className="btn-ghost" data-cursor="Explore">
                  Explore service <span className="btn-arrow">→</span>
                </Link>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <CTASection
        title={"Planning something\nsimilar?"}
        copy="Describe your building and goal — MOJATECH will respond with an honest technical view."
      />
    </>
  );
}
