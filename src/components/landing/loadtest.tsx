"use client";

import { motion } from "framer-motion";
import { ArrowDown, FlaskConical, ShieldAlert } from "lucide-react";
import { SectionHeading, Reveal, Counter } from "./reveal";

export function LoadTest() {
  return (
    <section className="relative overflow-hidden py-14 md:py-20">
      <div
        aria-hidden
        className="absolute left-[-8%] top-1/3 h-[380px] w-[380px] rounded-full bg-emerald-100/50 blur-[120px]"
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="load tested, not lab tested"
          title="Bursts in. Violations out. Zero."
          sub="Not a marketing number — an exit-non-zero test. 100 concurrent clients hammer the proxy while a mock upstream strictly enforces every per-key window and counts violations."
          align="center"
        />

        <Reveal delay={0.15}>
          <div className="mx-auto mt-10 grid max-w-4xl items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
            {/* 100 clients */}
            <div className="diffuse-card relative flex flex-col items-center gap-2 rounded-[1.6rem] px-6 py-9">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-400">
                concurrent clients
              </span>
              <p className="tnum font-mono text-[4.6rem] font-bold leading-none tracking-tighter text-stone-900">
                <Counter to={100} duration={1.9} />
              </p>
              <div className="mt-2 grid w-full max-w-[220px] grid-cols-10 gap-1">
                {Array.from({ length: 40 }).map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0.15, scaleY: 0.6 }}
                    animate={{ opacity: [0.25, 1, 0.25], scaleY: [0.6, 1, 0.6] }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      delay: (i % 10) * 0.14 + Math.floor(i / 10) * 0.35,
                      ease: "easeInOut",
                    }}
                    className="h-1.5 rounded-full bg-emerald-500"
                  />
                ))}
              </div>
            </div>

            {/* funnel */}
            <div className="flex flex-row items-center justify-center gap-3 md:flex-col">
              <div className="hidden h-14 w-px bg-gradient-to-b from-transparent via-emerald-500/60 to-transparent md:block" />
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-stone-900/10 bg-white shadow-sm">
                <ArrowDown className="h-4 w-4 rotate-90 text-stone-600 md:rotate-0" strokeWidth={1.8} />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-700">
                open-proxy
              </span>
              <div className="hidden h-14 w-px bg-gradient-to-b from-transparent via-emerald-500/60 to-transparent md:block" />
            </div>

            {/* 0 violations */}
            <div className="relative flex flex-col items-center gap-2 overflow-hidden rounded-[1.6rem] bg-stone-900 px-6 py-9 shadow-[0_36px_72px_-32px_oklch(0.216_0.008_90/0.5)]">
              <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-500/20 blur-3xl" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-400">
                upstream rate violations
              </span>
              <p className="tnum font-mono text-[4.6rem] font-bold leading-none tracking-tighter text-emerald-400">
                <Counter to={0} duration={1.9} />
              </p>
              <p className="mt-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500">
                <ShieldAlert className="h-3.5 w-3.5 text-emerald-500" strokeWidth={1.7} />
                enforced · counted · failed fast
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="mx-auto mt-10 flex max-w-[64ch] items-start justify-center gap-2.5 text-center text-[13.5px] leading-relaxed text-stone-400">
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-stone-300" strokeWidth={1.7} />
            The suite also covers auth, pacing enforcement mid-run, affinity,
            Retry-After timing, stall recovery and metrics accuracy — and fails
            on a single client-visible error.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
