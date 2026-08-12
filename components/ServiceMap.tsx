"use client";

import Link from "next/link";
import { useState } from "react";
import { services } from "@/lib/data/services";

/**
 * Signature interaction: a live system diagram with MOJATECH at the
 * centre. Hovering (or focusing, or tapping) a service energises its
 * connection and reveals a short description + CTA.
 * Every node is a real link, so the diagram is fully crawlable.
 */
export default function ServiceMap() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const n = services.length;

  const pos = (i: number) => {
    const angle = ((i / n) * 360 - 90) * (Math.PI / 180);
    const r = 40;
    return { x: 50 + r * Math.cos(angle), y: 50 + r * Math.sin(angle) };
  };

  const active = activeIdx === null ? null : services[activeIdx];

  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <div className="relative mx-auto aspect-square w-full max-w-xl select-none">
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="40" stroke="rgba(244,245,247,0.07)" strokeWidth="0.3" fill="none" />
          {services.map((s, i) => {
            const { x, y } = pos(i);
            const live = activeIdx === i;
            return (
              <g key={s.slug}>
                <line
                  x1="50"
                  y1="50"
                  x2={x}
                  y2={y}
                  stroke={live ? "#C8102E" : "rgba(244,245,247,0.14)"}
                  strokeWidth={live ? 0.7 : 0.35}
                  className={live ? "current" : undefined}
                  style={{ transition: "stroke 0.3s" }}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={live ? 1.6 : 1}
                  fill={live ? "#C8102E" : "#5A5FF0"}
                  className="node-pulse"
                />
              </g>
            );
          })}
          <circle cx="50" cy="50" r="2.2" fill="#C8102E" className="node-pulse" />
        </svg>

        {/* Centre */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-line bg-ink/90 px-4 py-2 text-center">
          <span className="font-display text-sm font-extrabold uppercase tracking-widest sm:text-base">
            Mojatech
          </span>
          <span className="block font-mono text-[8px] uppercase tracking-[0.24em] text-steel">
            Systems hub
          </span>
        </div>

        {/* Nodes */}
        {services.map((s, i) => {
          const { x, y } = pos(i);
          return (
            <Link
              key={s.slug}
              href={`/services/${s.slug}`}
              data-cursor="Explore"
              onMouseEnter={() => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}
              onFocus={() => setActiveIdx(i)}
              onBlur={() => setActiveIdx(null)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors duration-300 sm:px-3 sm:text-[11px] ${
                activeIdx === i
                  ? "border-brand-red bg-brand-red text-white"
                  : "border-line bg-ink/90 text-steel hover:text-white"
              }`}
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              {s.navLabel}
            </Link>
          );
        })}
      </div>

      <div aria-live="polite" className="min-h-[220px]">
        <p className="label-tech label-tech--blue">System detail</p>
        <h3 className="display mt-4 text-3xl sm:text-4xl">
          {active ? active.name : "One connected system."}
        </h3>
        <p className="mt-5 max-w-md text-base leading-relaxed text-steel">
          {active
            ? active.short
            : "Power, energy, protection and building systems are not separate problems — they share wiring, load and responsibility. Explore a node to see how MOJATECH connects them."}
        </p>
        <div className="mt-7">
          <Link
            href={active ? `/services/${active.slug}` : "/services"}
            className="btn-ghost"
            data-cursor="Explore"
          >
            {active ? `Explore ${active.navLabel}` : "Explore all services"}{" "}
            <span className="btn-arrow">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
