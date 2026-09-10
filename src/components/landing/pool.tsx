"use client";

import { motion } from "framer-motion";
import { KeyRound, Plus, Layers } from "lucide-react";
import { SectionHeading, Reveal, Counter } from "./reveal";

const EASE = [0.16, 1, 0.3, 1] as const;

const POOLS = [
  {
    provider: "NVIDIA NIM",
    keys: 3,
    rpm: 120,
    note: "free tier · 40 RPM/key",
  },
  {
    provider: "OpenRouter",
    keys: 5,
    rpm: 200,
    note: "credit-based · 40 RPM/key",
  },
];

function PoolRow({
  pool,
  index,
}: {
  pool: (typeof POOLS)[number];
  index: number;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-stone-900/[0.07] bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[12px] font-semibold uppercase tracking-wider text-stone-700">
            {pool.provider}
          </span>
          <span className="rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-stone-500">
            {pool.note}
          </span>
        </div>
        <span className="tnum font-mono text-[13px] font-semibold text-stone-900">
          {pool.rpm} RPM
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {Array.from({ length: pool.keys }).map((_, k) => (
          <motion.span
            key={k}
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 + index * 0.15 + k * 0.12, duration: 0.5, ease: EASE }}
            className="flex items-center gap-1 rounded-lg border border-emerald-600/20 bg-emerald-50 px-2 py-1 font-mono text-[10px] font-medium text-emerald-800"
          >
            <KeyRound className="h-2.5 w-2.5" strokeWidth={2} />
            key {k + 1}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

export function Pool() {
  return (
    <section className="relative py-24 md:py-32">
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-[480px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-100/40 blur-[130px]"
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <SectionHeading
            eyebrow="one intelligent pool"
            title={
              <>
                Your API keys.
                <br />
                One intelligent pool.
              </>
            }
            sub="Add keys from NVIDIA NIM, OpenRouter, TokenRouter, OpenAI — or any OpenAI-compatible endpoint. open-proxy distributes traffic across all of them while respecting each provider's limits. The more keys you add, the higher your combined throughput."
          />

          <Reveal delay={0.1}>
            <div className="relative rounded-[1.6rem] border border-stone-900/[0.07] bg-white/70 p-5 shadow-[0_32px_64px_-32px_oklch(0.216_0.008_90/0.18)] backdrop-blur-sm sm:p-6">
              <div className="flex flex-col gap-3">
                {POOLS.map((p, i) => (
                  <PoolRow key={p.provider} pool={p} index={i} />
                ))}
              </div>

              <div className="my-4 flex items-center justify-center gap-2 text-stone-300">
                <span className="h-px w-16 bg-stone-200" />
                <Plus className="h-4 w-4 text-emerald-600" strokeWidth={2} />
                <span className="h-px w-16 bg-stone-200" />
              </div>

              {/* merged pool */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.8, ease: EASE }}
                className="relative overflow-hidden rounded-2xl bg-stone-900 p-5"
              >
                <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-emerald-500/25 blur-2xl" />
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                      <Layers className="h-5 w-5 text-emerald-400" strokeWidth={1.7} />
                    </div>
                    <div className="leading-tight">
                      <p className="text-[14.5px] font-semibold text-stone-50">
                        Combined capacity
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">
                        automatically distributed
                      </p>
                    </div>
                  </div>
                  <p className="tnum font-mono text-3xl font-bold text-emerald-400">
                    <Counter to={320} duration={2} />{" "}
                    <span className="text-sm font-medium text-stone-400">RPM</span>
                  </p>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: "0%" }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.7, duration: 1.4, ease: EASE }}
                    className="stream-flow h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-300"
                  />
                </div>
                <p className="mt-3 font-mono text-[10.5px] leading-relaxed text-stone-400">
                  3 NIM keys (120 RPM) + 5 OpenRouter keys (200 RPM) — each key
                  holds its own limit, the pool makes agents patient enough to
                  live within the budget.
                </p>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
