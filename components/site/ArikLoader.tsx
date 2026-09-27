"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const Arik = dynamic(() => import("./Arik"), { ssr: false });

/** ARIK AI arrives once the page is settled, so he never slows the first view. */
export default function ArikLoader() {
  const [ready, setReady] = useState(false);
  const path = usePathname();
  useEffect(() => {
    const show = () => setReady(true);
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const id = w.requestIdleCallback ? w.requestIdleCallback(show, { timeout: 3000 }) : window.setTimeout(show, 1800);
    const wake = ["pointerdown", "touchstart", "keydown", "scroll"] as const;
    wake.forEach((e) => window.addEventListener(e, show, { passive: true, once: true }));
    return () => { wake.forEach((e) => window.removeEventListener(e, show)); window.clearTimeout(id as number); };
  }, []);
  if (path.startsWith("/admin")) return null;
  return ready ? <Arik /> : null;
}
