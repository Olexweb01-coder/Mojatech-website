import Breadcrumbs, { type Crumb } from "@/components/Breadcrumbs";

interface Props {
  eyebrow: string;
  title: string;
  lead?: string;
  crumbs: Crumb[];
  children?: React.ReactNode;
}

export default function PageHero({ eyebrow, title, lead, crumbs, children }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-line pb-16 pt-32 sm:pb-20 sm:pt-40">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-0 h-[420px] w-[420px] rounded-full bg-brand-blue/20 blur-[140px]"
      />
      <div className="shell relative">
        <div className="anim-rise" style={{ "--d": "0ms" } as React.CSSProperties}>
          <Breadcrumbs items={crumbs} />
        </div>
        <p className="label-tech anim-rise mt-8" style={{ "--d": "120ms" } as React.CSSProperties}>
          {eyebrow}
        </p>
        <h1
          className="display anim-mask mt-4 max-w-4xl text-5xl sm:text-6xl lg:text-7xl"
          style={{ "--d": "220ms" } as React.CSSProperties}
        >
          {title}
        </h1>
        {lead && (
          <p
            className="anim-rise mt-6 max-w-2xl text-base leading-relaxed text-steel sm:text-lg"
            style={{ "--d": "360ms" } as React.CSSProperties}
          >
            {lead}
          </p>
        )}
        {children && (
          <div className="anim-rise mt-9" style={{ "--d": "480ms" } as React.CSSProperties}>
            {children}
          </div>
        )}
      </div>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-10 w-full"
        viewBox="0 0 1200 40"
        preserveAspectRatio="none"
        fill="none"
      >
        <path d="M0 20 H1200" stroke="rgba(244,245,247,0.08)" strokeWidth="1.5" />
        <path d="M0 20 H1200" stroke="#C8102E" strokeWidth="1.5" className="current current--slow" />
      </svg>
    </section>
  );
}
