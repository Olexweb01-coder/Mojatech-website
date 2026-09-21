"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const FINE = "(pointer: fine)";
const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const fine = window.matchMedia(FINE);
  const reduced = window.matchMedia(REDUCED);
  fine.addEventListener("change", onChange);
  reduced.addEventListener("change", onChange);
  return () => {
    fine.removeEventListener("change", onChange);
    reduced.removeEventListener("change", onChange);
  };
}
const getSnapshot = () =>
  window.matchMedia(FINE).matches && !window.matchMedia(REDUCED).matches;
const getServerSnapshot = () => false;

/**
 * Subtle custom cursor. Desktop / fine-pointer devices only.
 * Elements can opt into a contextual label with `data-cursor="CONNECT"`.
 * Falls back gracefully: the native cursor is never hidden.
 */
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let x = -100;
    let y = -100;
    let cx = -100;
    let cy = -100;

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-cursor]"
      );
      setLabel(target?.dataset.cursor ?? "");
    };

    const tick = () => {
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      el.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`mt-cursor hidden lg:flex ${label ? "is-label" : ""}`}
    >
      <span>{label}</span>
    </div>
  );
}
