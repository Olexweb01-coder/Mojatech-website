import Link from "next/link";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden pt-24">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
      <div className="shell relative py-24 text-center">
        <svg
          aria-hidden="true"
          className="mx-auto mb-10 h-24 w-full max-w-md"
          viewBox="0 0 400 100"
          fill="none"
        >
          <path d="M0 50 H180 V20 H260" stroke="rgba(244,245,247,0.14)" strokeWidth="2" />
          <path d="M0 50 H180 V20 H260" stroke="#C8102E" strokeWidth="2" className="current" />
          <line x1="268" y1="8" x2="268" y2="32" stroke="#C8102E" strokeWidth="2" />
          <line x1="276" y1="12" x2="276" y2="28" stroke="rgba(244,245,247,0.4)" strokeWidth="2" />
          <path d="M180 50 V80 H400" stroke="rgba(90,95,240,0.6)" strokeWidth="2" className="current current--slow" />
          <circle cx="180" cy="50" r="4" fill="#5A5FF0" className="node-pulse" />
        </svg>
        <p className="label-tech justify-center">Error 404 — open circuit</p>
        <h1 className="display mt-5 text-5xl sm:text-7xl">System not found.</h1>
        <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-steel">
          The page you're looking for could not be located. The line below is still live —
          follow it home.
        </p>
        <div className="mt-10">
          <Link href="/" className="btn-primary" data-cursor="Connect">
            Return to MOJATECH <span className="btn-arrow">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
