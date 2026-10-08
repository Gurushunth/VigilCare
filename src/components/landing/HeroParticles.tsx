"use client";

import { useEffect, useMemo, useRef } from "react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import type { Container, Engine, ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

// Must be stable across the app lifecycle (tsParticles v4 ParticlesProvider rule).
async function initEngine(engine: Engine) {
  await loadSlim(engine);
}

type Props = {
  /** When true the connecting lines fade away: "signal lost". */
  deadZone: boolean;
  reducedMotion: boolean;
};

export default function HeroParticles({ deadZone, reducedMotion }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<Container | undefined>(undefined);
  // Decided once at mount; resizing across the breakpoint mid-pitch is not worth a reload.
  const isSmall = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches,
    [],
  );

  const options = useMemo<ISourceOptions>(
    () => ({
      fullScreen: { enable: false },
      background: { color: { value: "transparent" } },
      fpsLimit: 60,
      detectRetina: true,
      pauseOnBlur: true,
      pauseOnOutsideViewport: true,
      particles: {
        number: { value: isSmall ? 25 : 60 },
        paint: { fill: { enable: true, color: { value: "#0E7C86" }, opacity: 0.35 } },
        shape: { type: "circle" },
        size: { value: { min: 1.5, max: 3 } },
        links: {
          enable: true,
          distance: 150,
          color: "#0E7C86",
          opacity: deadZone ? 0 : 0.18,
          width: 1,
        },
        move: {
          enable: true,
          speed: 0.6,
          direction: "none",
          random: false,
          straight: false,
          outModes: { default: "out" },
        },
      },
      interactivity: {
        detectsOn: "window",
        events: {
          onHover: { enable: !deadZone, mode: "grab" },
        },
        modes: {
          grab: { distance: 160, links: { opacity: 0.35 } },
        },
      },
    }),
    [deadZone, isSmall],
  );

  // Belt and braces on top of pauseOnBlur / pauseOnOutsideViewport:
  // pause when the tab is hidden or the hero leaves the viewport.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    let visible = true;
    const sync = () => {
      const c = containerRef.current;
      if (!c) return;
      if (visible && document.visibilityState === "visible") c.play();
      else c.pause();
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [reducedMotion]);

  const onLoaded = useMemo(
    () => async (container?: Container) => {
      containerRef.current = container;
    },
    [],
  );

  // Reduced motion: no particles at all (the brief allows "a static frame or nothing";
  // nothing is the option that is guaranteed not to move).
  if (reducedMotion) return null;

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="hero-particles-mask pointer-events-none absolute inset-0"
    >
      <ParticlesProvider init={initEngine}>
        <Particles id="hero-particles" options={options} particlesLoaded={onLoaded} className="absolute inset-0" style={{ position: "absolute", inset: 0 }} />
      </ParticlesProvider>
    </div>
  );
}
