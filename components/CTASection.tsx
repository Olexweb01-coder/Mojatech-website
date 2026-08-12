import Link from "next/link";
import Reveal from "@/components/Reveal";

interface Props {
  title?: string;
  copy?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

/** Final conversion section — multiple lines converging into one point. */
export default function CTASection({
  title = "Let's power\nwhat's next.",
  copy = "Have an electrical, solar, security, safety, facility or building systems project? Let's discuss the right solution.",
  primaryLabel = "Request a consultation",
  primaryHref = "/contact",
  secondaryLabel = "Contact MOJATECH",
  secondaryHref = "/contact",
}: Props) {
  return (
    <section className="relative overflow-hidden border-t border-line bg-[#0a0b11]">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
        viewBox="0 0 1200 500"
        preserveAspectRatio="none"
        fill="none"
      >
        {[
          "M0 60 H420 L600 250",
          "M0 440 H420 L600 250",
          "M1200 60 H780 L600 250",
          "M1200 440 H780 L600 250",
          "M600 0 V250",
        ].map((d) => (
          <g key={d}>
            <path d={d} stroke="rgba(244,245,247,0.08)" strokeWidth="1.5" />
            <path d={d} stroke="#C8102E" strokeWidth="1.5" className="current current--slow" />
          </g>
        ))}
        <circle cx="600" cy="250" r="5" fill="#C8102E" className="node-pulse" />
      </svg>

      <div className="shell relative flex flex-col items-center py-28 text-center sm:py-36">
        <Reveal>
          <h2 className="display whitespace-pre-line text-5xl sm:text-7xl lg:text-8xl">
            {title}
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-steel sm:text-lg">{copy}</p>
        </Reveal>
        <Reveal delay={220}>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href={primaryHref} className="btn-primary" data-cursor="Connect">
              {primaryLabel} <span className="btn-arrow">→</span>
            </Link>
            <Link href={secondaryHref} className="btn-ghost" data-cursor="Connect">
              {secondaryLabel}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
