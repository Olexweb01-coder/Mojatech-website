"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type Variant = "up" | "left" | "right" | "scale" | "mask";

interface RevealProps {
  children: ReactNode;
  variant?: Variant;
  delay?: number; // ms
  className?: string;
  once?: boolean;
}

/**
 * Wraps content and reveals it when it enters the viewport.
 * Pure CSS transitions driven by an IntersectionObserver —
 * lightweight, SSR-safe and respects prefers-reduced-motion.
 */
export default function Reveal({
  children,
  variant = "up",
  delay = 0,
  className = "",
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add("is-in");
            if (once) io.unobserve(el);
          } else if (!once) {
            el.classList.remove("is-in");
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  const style = { "--reveal-delay": `${delay}ms` } as CSSProperties;

  return (
    <div ref={ref} data-reveal={variant} style={style} className={className}>
      {children}
    </div>
  );
}
