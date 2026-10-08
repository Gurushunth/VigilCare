"use client";

import { useEffect } from "react";

/** Registers /sw.js in production builds only; service workers misbehave under `next dev`. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* Offline support is a progressive enhancement; the site still works online. */
    });
  }, []);
  return null;
}
