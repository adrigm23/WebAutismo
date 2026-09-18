"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms, for revealing a group of siblings one after another. */
  delayMs?: number;
};

/**
 * Fades + rises a section in once it scrolls into view, reusing the same
 * "home-rise" keyframe the hero already animates with on load.
 *
 * Progressive enhancement, not a requirement for content to be visible:
 * - No JS / hydration never runs: the wrapper is a plain <div>, so content
 *   renders at full opacity from the server — nothing is ever stuck hidden.
 * - prefers-reduced-motion: reduce — the effect bails out before ever
 *   hiding the element, so motion-sensitive users just see static content.
 */
export function ScrollReveal({ children, className, delayMs = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    el.classList.add("scroll-reveal-pending");
    if (delayMs) {
      el.style.animationDelay = `${delayMs}ms`;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.remove("scroll-reveal-pending");
          el.classList.add("scroll-reveal-in");
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -80px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delayMs]);

  return (
    <div className={className} ref={ref}>
      {children}
    </div>
  );
}
