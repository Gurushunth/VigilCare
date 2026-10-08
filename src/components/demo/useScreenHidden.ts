"use client";

import { useEffect, useRef } from "react";

const SCREEN_EVENT = "vigilcare:screen";

/** Calls `onHidden` whenever the presenter switches away from `screen`. */
export function useScreenHidden(screen: string, onHidden: () => void) {
  const cb = useRef(onHidden);
  useEffect(() => {
    cb.current = onHidden;
  }, [onHidden]);
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== screen) cb.current();
    };
    window.addEventListener(SCREEN_EVENT, handler);
    return () => window.removeEventListener(SCREEN_EVENT, handler);
  }, [screen]);
}
