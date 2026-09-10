"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Github,
  Terminal,
  ArrowDown,
  Blocks,
  Gauge,
  Route,
  RefreshCw,
} from "lucide-react";
import { LogoMark } from "./logo";
import { Counter } from "./reveal";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ------------------------------------------------------------------ */
/* data                                                                */
/* ------------------------------------------------------------------ */

const PROVIDERS = [
  { name: "NVIDIA NIM", keys: "2× keys", rpm: 80, mono: "N", short: "NIM" },
  { name: "OpenRouter", keys: "2× keys", rpm: 40, mono: "OR", short: "OpenRouter" },
  { name: "TokenRouter", keys: "2× keys", rpm: 16, mono: "TR", short: "TokenRouter" },
  { name: "Other providers", keys: "self-hosted", rpm: 50, mono: "+", short: "Others" },
];

const CLIENTS = ["OpenCode", "Hermes", "Claude Code", "Codex", "n8n", "Cline"];

const WIRES = [
  "M 268 60 C 380 60, 400 196, 492 200",
  "M 268 172 C 370 172, 390 212, 492 214",
  "M 268 284 C 370 284, 390 242, 492 240",
  "M 268 396 C 380 396, 400 258, 492 256",
];

const STREAM = "M 708 228 C 758 228, 782 228, 838 228";

/* orbit geometry in viewBox space (1200 × 470) */
const ORBIT_CX = 1000;
const ORBIT_CY = 228;
const ORBIT_R = 150;

/* ------------------------------------------------------------------ */
/* pieces                                                              */
/* ------------------------------------------------------------------ */

function ProviderCard({
  p,
  i,
  compact,
}: {
  p: (typeof PROVIDERS)[number];
  i: number;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "diffuse-card float-y flex items-center gap-3 rounded-2xl px-4 py-3",
        compact && "gap-2.5 px-3 py-2.5"
      )}
      style={{ animationDelay: `${i * 0.7}s` }}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-900/10 bg-stone-50 font-mono text-[10px] font-semibold text-stone-600",
          compact && "h-8 w-8 text-[9px]"
        )}
      >
        {p.mono}
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p
          className={cn(
            "truncate text-[13px] font-semibold text-stone-800",
            compact && "text-[11.5px]"
          )}
        >
          {p.name}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-wider text-stone-400">
          {p.keys}
        </p>
      </div>
      <div className="text-right leading-tight">
        <p className="tnum font-mono text-[15px] font-semibold text-stone-900">
          {p.rpm}
        </p>
        <p className="font-mono text-[9px] uppercase tracking-widest text-stone-400">
          rpm
        </p>
      </div>
    </div>
  );
}

function ProxyCore() {
  const chips = [
    { icon: Blocks, label: "Queue" },
    { icon: Gauge, label: "Pace" },
    { icon: Route, label: "Route" },
    { icon: RefreshCw, label: "Retry" },
  ];
  return (
    <div className="core-pulse diffuse-card relative flex w-[220px] flex-col items-center gap-2.5 rounded-[1.4rem] px-5 py-5">
      <div className="flex items-center gap-2.5">
        <LogoMark className="h-9 w-9" />
        <div className="leading-tight">
          <p className="text-[15px] font-semibold tracking-tight text-stone-900">
            open-proxy
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-emerald-600">
            one endpoint
          </p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {chips.map((c) => (
          <span
            key={c.label}
            className="flex flex-col items-center gap-1 rounded-lg border border-stone-900/[0.07] bg-stone-50 px-1.5 py-1.5"
          >
            <c.icon className="h-3 w-3 text-emerald-600" strokeWidth={1.8} />
            <span className="font-mono text-[8px] uppercase tracking-wide text-stone-500">
              {c.label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function ClientChip({ name, compact }: { name: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "diffuse-card whitespace-nowrap rounded-full border border-emerald-600/15 bg-white px-3 py-1.5",
        compact ? "text-[10px]" : "text-[11.5px]"
      )}
    >
      <span className="font-mono font-medium text-stone-700">{name}</span>
    </div>
  );
}

function Orbit({ scale = 1 }: { scale?: number }) {
  return (
    <div
      className="relative"
      style={{ width: 2 * ORBIT_R * scale, height: 2 * ORBIT_R * scale }}
    >
      {/* dashed rings */}
      <div className="absolute inset-0 rounded-full border border-dashed border-stone-900/15" />
      <div className="absolute inset-[18%] rounded-full border border-stone-900/[0.07]" />
      {/* center */}
      <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-emerald-600/20 bg-emerald-50 shadow-[0_14px_28px_-12px_oklch(0.6_0.14_155/0.45)]">
        <Terminal className="h-5 w-5 text-emerald-600" strokeWidth={1.7} />
      </div>
      {/* revolving chips — positions relative to the orbit box itself */}
      <div className="orbit-ring absolute inset-0">
        {CLIENTS.map((c, i) => {
          const angle = (i / CLIENTS.length) * Math.PI * 2 - Math.PI / 2;
          const left = `${50 + 50 * Math.cos(angle)}%`;
          const top = `${50 + 50 * Math.sin(angle)}%`;
          return (
            <div
              key={c}
              className="absolute"
              style={{ left, top, transform: "translate(-50%,-50%)" }}
            >
              <div className="orbit-chip">
                <ClientChip name={c} compact={scale < 1} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* desktop diagram (aspect-locked so svg + html always align)          */
/* ------------------------------------------------------------------ */

function HeroDiagramDesktop() {
  return (
    <div className="relative hidden w-full lg:block">
      <div className="relative aspect-[1200/470] w-full">
        {/* giant infinity watermark */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-[57%] top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-mono text-[26rem] font-bold leading-none text-stone-900/[0.035]"
        >
          ∞
        </span>

        {/* wires + stream + rings */}
        <svg
          viewBox="0 0 1200 470"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="streamGrad"
              gradientUnits="userSpaceOnUse"
              x1="708"
              y1="228"
              x2="838"
              y2="228"
            >
              <stop offset="0%" stopColor="#047857" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* orbit rings */}
          <circle
            cx={ORBIT_CX}
            cy={ORBIT_CY}
            r={ORBIT_R}
            fill="none"
            stroke="oklch(0.216 0.008 90 / 0.14)"
            strokeWidth="1.2"
            strokeDasharray="3 7"
          />
          <circle
            cx={ORBIT_CX}
            cy={ORBIT_CY}
            r={ORBIT_R * 0.68}
            fill="none"
            stroke="oklch(0.216 0.008 90 / 0.07)"
            strokeWidth="1"
          />

          {/* provider wires */}
          {WIRES.map((d, i) => (
            <g key={d}>
              <path
                d={d}
                fill="none"
                stroke="oklch(0.216 0.008 90 / 0.13)"
                strokeWidth="1.4"
              />
              <path
                d={d}
                fill="none"
                stroke="oklch(0.6 0.14 155 / 0.55)"
                strokeWidth="1.6"
                className="wire-flow"
                style={{ animationDelay: `${i * 0.22}s` }}
              />
              {[0, 1].map((k) => (
                <circle key={k} r="3.2" fill="oklch(0.6 0.14 155)">
                  <animateMotion
                    dur="2.4s"
                    begin={`${-(i * 0.5 + k * 1.2)}s`}
                    repeatCount="indefinite"
                    path={d}
                  />
                </circle>
              ))}
            </g>
          ))}

          {/* the one thick stream — glow + body + moving dashes */}
          <path
            d={STREAM}
            fill="none"
            stroke="oklch(0.6 0.14 155 / 0.2)"
            strokeWidth="26"
            strokeLinecap="round"
          />
          <path
            d={STREAM}
            fill="none"
            stroke="url(#streamGrad)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d={STREAM}
            fill="none"
            stroke="oklch(0.98 0.03 155 / 0.8)"
            strokeWidth="5"
            strokeLinecap="round"
            className="stream-flow"
          />
          {[0, 1, 2].map((k) => (
            <circle key={k} r="4.6" fill="oklch(0.98 0.02 155)">
              <animateMotion
                dur="1.8s"
                begin={`${-k * 0.6}s`}
                repeatCount="indefinite"
                path={STREAM}
              />
            </circle>
          ))}
        </svg>

        {/* provider cards */}
        {PROVIDERS.map((p, i) => (
          <div
            key={p.name}
            className="absolute w-[21%]"
            style={{ left: "0.5%", top: `${(18 + i * 112) / 4.7}%` }}
          >
            <ProviderCard p={p} i={i} />
          </div>
        ))}

        {/* proxy core */}
        <div className="absolute" style={{ left: "41.2%", top: "48.5%", transform: "translate(-50%,-50%)" }}>
          <ProxyCore />
        </div>

        {/* 166 RPM stream label */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1, duration: 0.7, ease: EASE }}
          className="absolute z-10"
          style={{ left: "64.5%", top: "35%", transform: "translate(-50%,-50%)" }}
        >
          <div className="glass rounded-2xl px-4 py-2.5 text-center">
            <p className="tnum font-mono text-xl font-bold leading-none text-emerald-700">
              <Counter to={166} duration={2.2} />
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-stone-500">
              rpm combined
            </p>
          </div>
        </motion.div>

        {/* orbit of clients */}
        <div
          className="absolute"
          style={{
            left: `${(ORBIT_CX / 1200) * 100}%`,
            top: `${(ORBIT_CY / 470) * 100}%`,
            transform: "translate(-50%,-50%)",
          }}
        >
          <Orbit />
        </div>

        {/* orbit caption */}
        <div
          className="absolute text-center"
          style={{ left: "83.3%", top: "97%", transform: "translate(-50%,-50%)" }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-400">
            revolving clients
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* mobile diagram                                                      */
/* ------------------------------------------------------------------ */

function HeroDiagramMobile() {
  return (
    <div className="flex w-full flex-col items-center gap-5 lg:hidden">
      <div className="grid w-full grid-cols-2 gap-2.5">
        {PROVIDERS.map((p, i) => (
          <ProviderCard key={p.name} p={p} i={i} compact />
        ))}
      </div>

      <div className="flex flex-col items-center">
        <svg width="14" height="34" viewBox="0 0 14 34" aria-hidden="true">
          <line
            x1="7"
            y1="0"
            x2="7"
            y2="34"
            stroke="oklch(0.6 0.14 155 / 0.6)"
            strokeWidth="1.6"
            className="wire-flow"
          />
        </svg>
        <ArrowDown className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.8} />
      </div>

      <ProxyCore />

      <div className="flex w-full max-w-[340px] flex-col items-center gap-1.5">
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400">
          <div className="stream-flow absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_14px,oklch(0.98_0.02_155/0.75)_14px,oklch(0.98_0.02_155/0.75)_24px)]" />
        </div>
        <p className="tnum font-mono text-sm font-bold text-emerald-700">
          166 RPM combined
        </p>
      </div>

      <div className="scale-[0.62]">
        <Orbit />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* hero right stat card                                                */
/* ------------------------------------------------------------------ */

function RpmCard() {
  const bars = PROVIDERS;
  return (
    <div className="diffuse-card relative overflow-hidden rounded-[1.6rem] p-6">
      <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-emerald-200/40 blur-3xl" />
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-stone-400">
        combined capacity
      </p>
      <div className="mt-2 flex items-end gap-3">
        <span className="font-mono text-[4.6rem] font-bold leading-[0.85] tracking-tighter text-stone-900">
          ∞
        </span>
        <div className="pb-1.5">
          <p className="tnum font-mono text-sm font-semibold text-emerald-700">
            <Counter to={166} /> RPM pooled
          </p>
          <p className="text-[12px] leading-snug text-stone-500">
            effective ceiling for
            <br />
            every connected agent
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-2.5">
        {bars.map((b, i) => (
          <div key={b.name} className="flex items-center gap-2.5">
            <span className="w-[84px] shrink-0 truncate font-mono text-[10px] uppercase tracking-wider text-stone-400">
              {b.short}
            </span>
            <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-stone-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(b.rpm / 80) * 100}%` }}
                transition={{ delay: 0.5 + i * 0.15, duration: 1.1, ease: EASE }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-600/80 to-emerald-400"
              />
            </div>
            <span className="tnum w-8 text-right font-mono text-[11px] font-semibold text-stone-700">
              {b.rpm}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-5 border-t border-stone-900/[0.07] pt-3.5 font-mono text-[10.5px] leading-relaxed text-stone-400">
        80 + 40 + 16 + 50 = <span className="font-semibold text-stone-600">166 RPM</span>{" "}
        — every key keeps its own limit. your agents never see one.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* hero                                                                */
/* ------------------------------------------------------------------ */

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pb-14 pt-32 md:pt-40">
      {/* backdrop */}
      <div className="blueprint-grid absolute inset-0" aria-hidden />
      <div
        aria-hidden
        className="aurora absolute -top-32 left-[8%] h-[420px] w-[420px] rounded-full bg-emerald-200/35 blur-[110px]"
      />
      <div
        aria-hidden
        className="aurora absolute right-[4%] top-40 h-[360px] w-[360px] rounded-full bg-amber-100/50 blur-[110px]"
        style={{ animationDelay: "-7s" }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
          {/* left — copy */}
          <div className="cascade flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-stone-900/10 bg-white/80 px-3.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-stone-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 heartbeat-dot" />
              OpenAI-compatible · Self-hosted · MIT
            </span>

            <h1 className="text-balance text-[2.6rem] font-semibold leading-[1.02] tracking-tighter text-stone-900 sm:text-6xl lg:text-[4.35rem]">
              Run AI agents without fighting{" "}
              <span className="relative inline-block whitespace-nowrap text-emerald-700">
                rate limits.
                <svg
                  className="absolute -bottom-1.5 left-0 w-full"
                  viewBox="0 0 220 10"
                  fill="none"
                  aria-hidden
                  preserveAspectRatio="none"
                >
                  <path
                    d="M3 7 C 60 2, 150 2, 217 6"
                    stroke="oklch(0.6 0.14 155 / 0.5)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="max-w-[58ch] text-[15.5px] leading-relaxed text-stone-500 md:text-[17px]">
              One OpenAI-compatible endpoint for all your providers and API keys.
              open-proxy queues, paces, load-balances, retries and fails over
              across your keys — so your agents keep running instead of hitting
              429s.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#quickstart"
                className="group inline-flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-3.5 text-[15px] font-medium text-stone-50 shadow-[0_18px_36px_-16px_oklch(0.216_0.008_90/0.5)] transition-all hover:-translate-y-0.5 hover:bg-stone-800 active:translate-y-0"
              >
                Get Started
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  strokeWidth={1.8}
                />
              </a>
              <a
                href="https://github.com/miztertea/nim-proxy"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-stone-900/12 bg-white px-6 py-3.5 text-[15px] font-medium text-stone-800 transition-all hover:-translate-y-0.5 hover:border-stone-900/25 active:translate-y-0"
              >
                <Github className="h-4 w-4" strokeWidth={1.8} />
                View on GitHub
              </a>
            </div>

            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">
              NVIDIA NIM · OpenRouter · TokenRouter · OpenAI · any compatible API
            </p>
          </div>

          {/* right — rpm card */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotate: 1.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ delay: 0.35, duration: 1, ease: EASE }}
          >
            <RpmCard />
          </motion.div>
        </div>

        {/* diagram */}
        <motion.div
          initial={{ opacity: 0, y: 44 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 1.1, ease: EASE }}
          className="mt-16 md:mt-20"
        >
          <HeroDiagramDesktop />
          <HeroDiagramMobile />
          <p className="mx-auto mt-8 max-w-[70ch] text-center text-[13px] leading-relaxed text-stone-400">
            Your application sees one API. open-proxy handles the complexity
            behind it — one thick stream out, every upstream limit quietly
            respected.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
