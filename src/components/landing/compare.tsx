"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CircleX, CircleCheck, Timer } from "lucide-react";
import { SectionHeading, Reveal } from "./reveal";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* typing terminal (isolated, strict cleanup)                          */
/* ------------------------------------------------------------------ */

type Line = { text: string; tone: "dim" | "err" | "ok" | "wait" };

function useTypewriter(lines: Line[], speed = 26, hold = 2200) {
  const [out, setOut] = useState<Line[]>([]);
  const [partial, setPartial] = useState("");
  const mounted = useRef(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    mounted.current = true;
    const schedule = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        if (mounted.current) fn();
      }, ms);
      timers.current.push(t);
    };

    const run = (li: number) => {
      if (li >= lines.length) {
        schedule(() => {
          setOut([]);
          setPartial("");
          run(0);
        }, hold + 1400);
        return;
      }
      const line = lines[li];
      let ci = 0;
      const type = () => {
        if (!mounted.current) return;
        if (ci <= line.text.length) {
          setPartial(line.text.slice(0, ci));
          ci += 1;
          schedule(type, speed);
        } else {
          setPartial("");
          setOut((prev) => [...prev.slice(-4), line]);
          schedule(() => run(li + 1), 340);
        }
      };
      type();
    };
    run(0);

    return () => {
      mounted.current = false;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  return { out, partial };
}

const TONE: Record<Line["tone"], string> = {
  dim: "text-stone-500",
  err: "text-rose-600",
  ok: "text-emerald-600",
  wait: "text-amber-600",
};

function TerminalWindow({
  lines,
  variant,
}: {
  lines: Line[];
  variant: "bad" | "good";
}) {
  const { out, partial } = useTypewriter(lines);
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-[#0c0a09]",
        variant === "bad"
          ? "border-rose-900/40 shadow-[0_28px_56px_-24px_oklch(0.577_0.245_27/0.35)]"
          : "border-emerald-900/40 shadow-[0_28px_56px_-24px_oklch(0.6_0.14_155/0.4)]"
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-white/[0.07] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
          {variant === "bad" ? "agent — raw" : "agent — via open-proxy"}
        </span>
      </div>
      <div className="h-[212px] space-y-2 overflow-hidden px-5 py-4 font-mono text-[12px] leading-relaxed">
        {out.map((l, i) => (
          <p key={`${l.text}-${i}`} className={TONE[l.tone]}>
            {l.tone === "err" ? "✕ " : l.tone === "ok" ? "✓ " : "  "}
            {l.text}
          </p>
        ))}
        {partial && (
          <p className="text-stone-300">
            {"  "}
            {partial}
            <span className="term-caret ml-0.5 inline-block h-3.5 w-[7px] translate-y-[2px] bg-emerald-400/80" />
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const WITHOUT: Line[] = [
  { text: "$ agent run --task deploy-service", tone: "dim" },
  { text: "→ POST /v1/chat/completions", tone: "dim" },
  { text: "429 Too Many Requests", tone: "err" },
  { text: "429 Too Many Requests", tone: "err" },
  { text: "429 Too Many Requests", tone: "err" },
  { text: "agent aborted — task failed", tone: "err" },
];

const WITH: Line[] = [
  { text: "$ agent run --task deploy-service", tone: "dim" },
  { text: "queued · slot granted (key #3)", tone: "wait" },
  { text: "429 → retry-after 1.2s → key #5", tone: "wait" },
  { text: "200 OK · stream open · heartbeat", tone: "ok" },
  { text: "200 OK · 18,204 tokens · done", tone: "ok" },
  { text: "agent finished — task complete", tone: "ok" },
];

export function Compare() {
  return (
    <section id="how" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="the 429 tax"
          title={
            <>
              Every upstream has a speed limit.
              <br />
              <span className="text-stone-400">Your agents shouldn&apos;t feel it.</span>
            </>
          }
          sub="One key, 40 requests per minute. The moment an agent bursts past it, the provider answers 429 — and most clients simply abort the run. open-proxy sits in between and makes the limit invisible."
        />

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-[1fr_auto_1fr]">
          <Reveal className="h-full">
            <div className="flex h-full flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-rose-600">
                  without open-proxy
                </p>
                <CircleX className="h-4 w-4 text-rose-500" strokeWidth={1.8} />
              </div>
              <TerminalWindow lines={WITHOUT} variant="bad" />
              <p className="text-[13.5px] leading-relaxed text-stone-500">
                Bursts hit the same key, the window closes, and the run dies
                mid-task. Retry logic ends up hand-rolled in every app.
              </p>
            </div>
          </Reveal>

          <div className="hidden items-center lg:flex">
            <motion.div
              animate={{ x: [0, 7, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-900/10 bg-white shadow-sm"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-stone-600" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </motion.div>
          </div>

          <Reveal delay={0.12} className="h-full">
            <div className="flex h-full flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-700">
                  with open-proxy
                </p>
                <CircleCheck className="h-4 w-4 text-emerald-600" strokeWidth={1.8} />
              </div>
              <TerminalWindow lines={WITH} variant="good" />
              <p className="text-[13.5px] leading-relaxed text-stone-500">
                Requests queue instead of failing. 429s ride out with Retry-After,
                traffic shifts to healthy keys — the run just continues.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <div className="mt-12 flex items-center justify-center gap-3 rounded-2xl border border-stone-900/[0.07] bg-white px-6 py-5 shadow-[0_18px_36px_-24px_oklch(0.216_0.008_90/0.2)]">
            <Timer className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={1.8} />
            <p className="text-center text-[15px] font-medium text-stone-700">
              Your application sees one API.{" "}
              <span className="text-stone-400">open-proxy handles the complexity behind it.</span>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
