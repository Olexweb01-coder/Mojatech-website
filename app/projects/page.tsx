import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import CTASection from "@/components/CTASection";
import { projects } from "@/lib/data/projects";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Projects — Electrical, Solar, Security & Facility Work in Lagos | MOJATECH",
  description:
    "A growing archive of MOJATECH projects across Lagos, Nigeria — electrical installations, solar power systems, security systems and building facility work.",
  path: "/projects",
});

export default function ProjectsPage() {
  return (
    <>
      <PageHero
        eyebrow="Delivered work"
        title="Project archive."
        lead="Electrical, solar, security and facility work across Lagos. The records below are clearly-marked editable templates until MOJATECH's real case studies are published — nothing here is invented."
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Projects", href: "/projects" },
        ]}
      />

      <section className="relative py-20 sm:py-28">
        <div className="shell">
          <div className="grid gap-8 md:grid-cols-2">
            {projects.map((p, i) => (
              <Reveal key={p.slug} delay={(i % 2) * 100}>
                <Link
                  href={`/projects/${p.slug}`}
                  data-cursor="View project"
                  className="group block border border-line bg-panel/50 transition-colors duration-300 hover:border-paper/25"
                >
                  <ImagePlaceholder label={p.imageLabel} ratio="aspect-[16/9]" />
                  <div className="p-7">
                    <p className="label-tech label-tech--plain text-steel/80">
                      {p.category} · {p.location}
                      {p.completed ? ` · ${p.completed}` : ""}
                    </p>
                    <h2 className="display mt-3 text-2xl transition-colors group-hover:text-brand-redBright sm:text-3xl">
                      {p.name}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-steel">{p.summary}</p>
                    {p.placeholder && (
                      <p className="mt-4 inline-block border border-brand-blueBright/40 bg-brand-blue/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-brand-blueBright">
                        Editable template — not a published project
                      </p>
                    )}
                    <span className="mt-5 block font-mono text-[11px] uppercase tracking-[0.2em] text-paper/80">
                      View case study structure →
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal delay={150}>
            <p className="mt-12 max-w-2xl font-mono text-[11px] uppercase leading-relaxed tracking-[0.16em] text-steel">
              Site owner: publish real projects by editing{" "}
              <span className="text-paper/70">lib/data/projects.ts</span> — fill in real
              details, add images and set <span className="text-paper/70">placeholder: false</span>.
            </p>
          </Reveal>
        </div>
      </section>

      <CTASection
        title={"Your project could\nbe next."}
        copy="Tell MOJATECH what you're planning — electrical, solar, security, safety or full facility support."
      />
    </>
  );
}
