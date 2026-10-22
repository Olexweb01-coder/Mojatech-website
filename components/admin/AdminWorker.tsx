"use client";
import { useEffect } from "react";

/** Registers the admin's own service worker, scoped to /admin only. */
export default function AdminWorker() {
  useEffect(() => {
    /* In development (npm run dev) it is registered too, so alerts can be tried locally. */
    if (!("serviceWorker" in navigator)) return;
    const go = () => navigator.serviceWorker.register(process.env.NODE_ENV === "production" ? "/admin-sw.js" : "/admin-sw.js?dev=1", { scope: "/admin" }).catch(() => {});
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
  }, []);
  return null;
}
