"use client";
import { useEffect } from "react";

/** Registers the small service worker that makes the site installable. */
export default function AppInstall() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const id = window.setTimeout(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }, 2500);   /* after the page has settled, so it never delays the first view */
    return () => window.clearTimeout(id);
  }, []);
  return null;
}
