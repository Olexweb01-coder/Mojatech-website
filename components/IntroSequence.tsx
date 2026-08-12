"use client";

import { useEffect, useRef, useState } from "react";

const words = [
  "Electrical",
  "Solar",
  "Security",
  "Safety",
  "Facility",
  "Consultancy",
];

/**
 * Signature scroll moment: as the visitor scrolls, an electrical line
 * energises each discipline in sequence, ending on the company promise.
 * Built with position:sticky + a scroll-progress listener (no heavy deps).
 */
export default function IntroSequence() {
  const outer = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = outer.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
      setProgress(p);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // 0 → headline, then one step per word, final step → closing statement
  const steps = words.length + 1;
  const active = Math.min(steps, Math.floor(progress * (steps + 0.999)));
  const done = active >= steps;

  return (
    <section ref={outer} aria-label="What MOJATECH engineers" className="relative h-[320vh]">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" />
        <div className="shell relative">
          <p className="label-tech">One technical partner</p>
          <h2 className="display mt-4 max-w-4xl text-4xl sm:text-6xl lg:text-7xl">
            Engineering more than power.
          </h2>

          <div className="relative mt-10 sm:mt-14">
            {/* connecting line */}
            <div
              aria-hidden="true"
              className="absolute left-[6px] top-0 h-full w-px bg-line"
            />
            <div
              aria-hidden="true"
              className="absolute left-[6px] top-0 w-px bg-gradient-to-b from-brand-red to-brand-blueBright shadow-[0_0_10px_rgba(200,16,46,0.6)] transition-[height] duration-500 ease-power"
              style={{ height: `${Math.min(1, active / steps) * 100}%` }}
            />
            <ol className="space-y-2 pl-8 sm:space-y-3">
              {words.map((w, i) => {
                const live = active > i;
                return (
                  <li key={w} className="relative">
                    <span
                      aria-hidden="true"
                      className={`absolute -left-8 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full transition-all duration-500 ${
                        live
                          ? "bg-brand-red shadow-[0_0_10px_rgba(200,16,46,0.9)]"
                          : "bg-paper/15"
                      }`}
                    />
                    <span
                      className={`intro-word display block text-3xl sm:text-5xl lg:text-6xl ${
                        live ? "is-live" : ""
                      } ${live && i === active - 1 && !done ? "text-brand-redBright" : ""}`}
                    >
                      {w}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          <p
            className={`label-tech label-tech--blue mt-10 transition-all duration-700 ${
              done ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            One technical partner. Multiple building systems.
          </p>
        </div>
      </div>
    </section>
  );
}
