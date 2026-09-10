"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowDown } from "lucide-react";

/* Ordered anchors matching the landing page sections */
const NODES = [
  { id: "top", label: "Overview" },
  { id: "how", label: "How it works" },
  { id: "pool", label: "Key pool" },
  { id: "features", label: "Features" },
  { id: "endpoints", label: "Endpoints" },
  { id: "dashboard", label: "Dashboard" },
  { id: "security", label: "Security" },
  { id: "quickstart", label: "Quickstart" },
  { id: "start", label: "Get started" },
];

const smooth = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? ("auto" as ScrollBehavior)
    : ("smooth" as ScrollBehavior);

export function ScrollRail() {
  const { scrollYProgress } = useScroll();
  const fill = useSpring(scrollYProgress, {
    stiffness: 130,
    damping: 24,
    mass: 0.5,
  });
  const travelerTop = useTransform(fill, (v) => `${(v * 100).toFixed(2)}%`);

  const [pct, setPct] = useState(0);
  const [active, setActive] = useState(0);
  const [nearEnd, setNearEnd] = useState(false);
  const offsets = useRef<number[]>([]);

  useMotionValueEvent(fill, "change", (v) => {
    const p = Math.round(v * 100);
    setPct((prev) => (prev === p ? prev : p));
    setNearEnd(v > 0.92);
  });

  useEffect(() => {
    const measure = () => {
      offsets.current = NODES.map((n) => {
        const el = document.getElementById(n.id);
        return el
          ? el.getBoundingClientRect().top + window.scrollY
          : Number.MAX_SAFE_INTEGER;
      });
    };
    measure();
    const t1 = setTimeout(measure, 800);
    const t2 = setTimeout(measure, 2200);
    window.addEventListener("resize", measure);

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY + window.innerHeight * 0.35;
        const off = offsets.current;
        let a = 0;
        for (let i = 0; i < off.length; i++) {
          if (off[i] <= y) a = i;
        }
        setActive((prev) => (prev === a ? prev : a));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const goTo = useCallback((id: string) => {
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: smooth() });
      return;
    }
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: smooth(), block: "start" });
  }, []);

  const jump = useCallback(() => {
    if (nearEnd) window.scrollTo({ top: 0, behavior: smooth() });
    else
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: smooth(),
      });
  }, [nearEnd]);

  return (
    <nav
      aria-label="Page scroll progress"
      className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 xl:block"
    >
      <div className="flex flex-col items-center gap-2.5 rounded-full border border-stone-900/[0.07] bg-white/70 px-2 py-3.5 shadow-[0_18px_44px_-22px_oklch(0.216_0.008_90/0.4)] backdrop-blur-xl">
        <span className="select-none font-mono text-[8.5px] font-medium uppercase tracking-[0.24em] text-stone-400 [writing-mode:vertical-rl]">
          scroll
        </span>

        {/* progress track */}
        <div className="relative h-56 w-px">
          {/* base */}
          <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 rounded-full bg-stone-900/[0.09]" />
          {/* fill — grows downward, spring-lagged */}
          <motion.div
            aria-hidden
            style={{ scaleY: fill }}
            className="absolute inset-y-0 left-1/2 w-[2px] origin-top -translate-x-1/2 rounded-full bg-gradient-to-b from-emerald-600 via-emerald-500 to-emerald-300"
          />
          {/* traveler — glowing dot chasing the scroll position */}
          <motion.div
            aria-hidden
            style={{ top: travelerTop }}
            className="absolute left-1/2 z-0 -translate-x-1/2 -translate-y-1/2"
          >
            <span className="block h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_oklch(0.7_0.15_155/0.16),0_0_14px_oklch(0.7_0.15_155/0.75)]" />
          </motion.div>
          {/* section nodes */}
          {NODES.map((n, i) => (
            <button
              key={n.id}
              type="button"
              onClick={() => goTo(n.id)}
              aria-label={`Go to ${n.label}`}
              aria-current={active === i ? "true" : undefined}
              style={{ top: `${(i / (NODES.length - 1)) * 100}%` }}
              className="group absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 p-1.5"
            >
              <span
                className={
                  "block rounded-full transition-all duration-300 " +
                  (active === i
                    ? "h-2 w-2 bg-emerald-600 ring-[3px] ring-emerald-600/15"
                    : "h-1.5 w-1.5 bg-stone-300 group-hover:bg-stone-500")
                }
              />
              <span
                className={
                  "pointer-events-none absolute right-[calc(100%+10px)] top-1/2 flex -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2 py-1 font-mono text-[9px] font-medium uppercase tracking-[0.14em] shadow-[0_10px_24px_-14px_oklch(0.216_0.008_90/0.4)] transition-all duration-200 " +
                  (active === i
                    ? "translate-x-0 border-emerald-600/25 bg-white text-emerald-700 opacity-100"
                    : "translate-x-1.5 border-stone-900/[0.07] bg-white text-stone-500 opacity-0 group-hover:translate-x-0 group-hover:opacity-100")
                }
              >
                <span className="tabular-nums text-stone-300">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {n.label}
              </span>
            </button>
          ))}
        </div>

        {/* live percentage */}
        <span className="select-none font-mono text-[9px] font-semibold tabular-nums tracking-[0.12em] text-stone-500">
          {pct}%
        </span>

        {/* skip-to-end / back-to-top */}
        <button
          type="button"
          onClick={jump}
          aria-label={nearEnd ? "Back to top" : "Skip to end of page"}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-900/[0.09] bg-white text-stone-400 shadow-sm transition-all duration-300 hover:border-emerald-500/40 hover:bg-emerald-500 hover:text-white"
        >
          <ArrowDown
            className={
              "h-3.5 w-3.5 transition-transform duration-300 " +
              (nearEnd ? "rotate-180" : "rotate-0")
            }
            strokeWidth={2}
          />
        </button>
      </div>
    </nav>
  );
}
