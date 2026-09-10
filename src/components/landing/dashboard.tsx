"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Boxes, Users, ShieldCheck, BatteryCharging } from "lucide-react";
import { SectionHeading, Reveal, Counter } from "./reveal";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ------------------------------------------------------------------ */
/* chart primitives (deterministic data — no random at render)         */
/* ------------------------------------------------------------------ */

function Area({
  data,
  id,
  color = "#059669",
}: {
  data: number[];
  id: string;
  color?: string;
}) {
  const w = 560;
  const h = 150;
  const max = Math.max(...data);
  const pts = data.map(
    (v, i) =>
      `${((i / (data.length - 1)) * w).toFixed(1)},${(
        h -
        (v / max) * (h - 18) -
        6
      ).toFixed(1)}`
  );
  const line = `M${pts.join(" L")}`;
  const area = `${line} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[150px] w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1="0"
          x2={w}
          y1={h * f}
          y2={h * f}
          stroke="oklch(0.216 0.008 90 / 0.06)"
          strokeWidth="1"
        />
      ))}
      <motion.path
        d={area}
        fill={`url(#g-${id})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.1, delay: 0.35 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, ease: EASE }}
      />
    </svg>
  );
}

function Ring({
  pct,
  label,
  sub,
  color = "oklch(0.6 0.14 155)",
}: {
  pct: number;
  label: string;
  sub: string;
  color?: string;
}) {
  const r = 34;
  const C = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-[86px] w-[86px]">
        <svg viewBox="0 0 86 86" className="h-full w-full -rotate-90">
          <circle cx="43" cy="43" r={r} fill="none" stroke="oklch(0.216 0.008 90 / 0.07)" strokeWidth="8" />
          <motion.circle
            cx="43"
            cy="43"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C * (1 - pct) }}
            transition={{ duration: 1.4, ease: EASE }}
          />
        </svg>
        <span className="tnum absolute inset-0 flex items-center justify-center font-mono text-[14px] font-bold text-stone-900">
          {(pct * 100).toFixed(1)}%
        </span>
      </div>
      <div className="leading-tight">
        <p className="text-[13px] font-semibold text-stone-800">{label}</p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-stone-400">
          {sub}
        </p>
      </div>
    </div>
  );
}

function Kpi({ label, value, suffix, delta }: { label: string; value: number; suffix?: string; delta?: string }) {
  return (
    <div className="rounded-xl border border-stone-900/[0.06] bg-white px-4 py-3.5">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-stone-400">{label}</p>
      <p className="tnum mt-1.5 font-mono text-[20px] font-bold leading-none text-stone-900">
        <Counter to={value} decimals={value % 1 !== 0 ? 1 : 0} />
        {suffix && <span className="ml-0.5 text-[11px] font-medium text-stone-400">{suffix}</span>}
      </p>
      {delta && <p className="mt-1 font-mono text-[9.5px] text-emerald-600">{delta}</p>}
    </div>
  );
}

function HBar({ name, value, max, unit }: { name: string; value: number; max: number; unit: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-[150px] shrink-0 truncate font-mono text-[10.5px] text-stone-500">{name}</span>
      <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-stone-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 1.1, ease: EASE }}
          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
        />
      </div>
      <span className="tnum w-[74px] shrink-0 text-right font-mono text-[10.5px] font-semibold text-stone-700">
        {value.toLocaleString()} {unit}
      </span>
    </div>
  );
}

function Heatmap() {
  const cells = [
    0.1, 0.15, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.9, 0.75, 0.6, 0.4,
    0.05, 0.1, 0.15, 0.3, 0.45, 0.7, 0.85, 0.95, 0.85, 0.7, 0.5, 0.3,
    0.1, 0.1, 0.2, 0.4, 0.55, 0.75, 0.9, 1.0, 0.8, 0.65, 0.45, 0.25,
    0.05, 0.1, 0.15, 0.25, 0.4, 0.6, 0.8, 0.9, 0.95, 0.8, 0.55, 0.35,
  ];
  return (
    <div className="grid grid-cols-12 gap-[3px]">
      {cells.map((c, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.012, duration: 0.4 }}
          className="aspect-square rounded-[3px]"
          style={{ background: `oklch(0.6 0.14 155 / ${0.12 + c * 0.88})` }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* tabs                                                                */
/* ------------------------------------------------------------------ */

const REQ = [42, 51, 47, 63, 58, 71, 66, 82, 77, 91, 86, 97, 88, 104];
const TOK = [18, 24, 21, 29, 26, 34, 31, 42, 38, 47, 44, 56];

const TABS = [
  {
    id: "overview",
    label: "Overview",
    icon: Activity,
    content: (
      <div className="grid gap-4 md:grid-cols-[1fr_240px]">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <Kpi label="requests / min" value={97} suffix="rpm" delta="+12% vs 24h" />
            <Kpi label="tokens / min" value={56.4} suffix="k" delta="+8.2% vs 24h" />
            <Kpi label="active clients" value={11} delta="3 streaming" />
          </div>
          <div className="rounded-xl border border-stone-900/[0.06] bg-white p-4">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-stone-400">
              requests over time
            </p>
            <Area data={REQ} id="ov-req" />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-stone-900/[0.06] bg-white p-4">
            <Ring pct={0.997} label="Success rate" sub="slo 99.9%" />
          </div>
          <div className="flex flex-1 flex-col justify-between gap-2 rounded-xl border border-stone-900/[0.06] bg-white p-4">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-stone-400">
              top models
            </p>
            <HBar name="kimi-k2-instruct" value={41} max={50} unit="rpm" />
            <HBar name="deepseek-r1" value={28} max={50} unit="rpm" />
            <HBar name="qwen3-235b" value={17} max={50} unit="rpm" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "models",
    label: "Models",
    icon: Boxes,
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-stone-900/[0.06] bg-white p-4">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-stone-400">
            tokens per minute
          </p>
          <Area data={TOK} id="md-tok" color="#0d9488" />
          <div className="mt-2 flex justify-between font-mono text-[9px] text-stone-400">
            <span>-30d</span>
            <span>now</span>
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-stone-900/[0.06] bg-white p-4">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-stone-400">
            latency profile
          </p>
          {[
            { k: "TTFT", v: "412 ms", w: 34 },
            { k: "generation", v: "38.2 tok/s", w: 72 },
            { k: "inter-token", v: "26 ms", w: 18 },
            { k: "upstream", v: "1.9 s", w: 52 },
          ].map((r, i) => (
            <div key={r.k} className="flex items-center gap-3">
              <span className="w-[92px] font-mono text-[10.5px] text-stone-500">{r.k}</span>
              <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-stone-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${r.w}%` }}
                  transition={{ delay: i * 0.12, duration: 1, ease: EASE }}
                  className="h-full rounded-full bg-emerald-500/85"
                />
              </div>
              <span className="tnum w-[74px] text-right font-mono text-[10.5px] font-semibold text-stone-700">{r.v}</span>
            </div>
          ))}
          <p className="mt-auto font-mono text-[9.5px] text-stone-400">
            reasoning share 23% · truncation 0.4%
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "clients",
    label: "Clients",
    icon: Users,
    content: (
      <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-stone-900/[0.06] bg-white p-4">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-stone-400">
            client leaderboard
          </p>
          <div className="mt-3 flex flex-col divide-y divide-stone-900/[0.05]">
            {[
              ["OpenCode", "52.1k req", "3.9 tools/req"],
              ["Codex CLI", "31.7k req", "2.1 tools/req"],
              ["n8n", "12.4k req", "1.2 tools/req"],
              ["Cline", "8.9k req", "4.6 tools/req"],
              ["Hermes", "5.2k req", "6.3 tools/req"],
            ].map(([n, r, t], i) => (
              <div key={n} className="flex items-center justify-between py-2.5">
                <span className="flex items-center gap-2.5">
                  <span className="tnum font-mono text-[10px] text-stone-300">0{i + 1}</span>
                  <span className="text-[12.5px] font-semibold text-stone-800">{n}</span>
                </span>
                <span className="tnum font-mono text-[10px] text-stone-400">
                  {r} · {t}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Kpi label="streaming share" value={94.2} suffix="%" />
            <Kpi label="conv. depth" value={17} suffix="msgs" />
          </div>
          <div className="flex-1 rounded-xl border border-stone-900/[0.06] bg-white p-4">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-stone-400">
              sampling fingerprint
            </p>
            <Area data={[12, 14, 13, 16, 15, 19, 18, 22, 21, 24, 23, 26]} id="cl-temp" color="#0d9488" />
            <p className="font-mono text-[9.5px] text-stone-400">temperature drift · 30d</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "reliability",
    label: "Reliability",
    icon: ShieldCheck,
    content: (
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-stone-900/[0.06] bg-white p-4">
            <Ring pct={0.9992} label="Availability" sub="slo 99.9% · budget 96% left" />
          </div>
          <div className="rounded-xl border border-stone-900/[0.06] bg-white p-4">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-stone-400">
              latency breakdown
            </p>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full">
              <motion.span initial={{ width: 0 }} animate={{ width: "38%" }} transition={{ duration: 0.9, ease: EASE }} className="bg-emerald-600" />
              <motion.span initial={{ width: 0 }} animate={{ width: "44%" }} transition={{ duration: 0.9, delay: 0.15, ease: EASE }} className="bg-emerald-400" />
              <motion.span initial={{ width: 0 }} animate={{ width: "18%" }} transition={{ duration: 0.9, delay: 0.3, ease: EASE }} className="bg-stone-300" />
            </div>
            <div className="mt-2 flex justify-between font-mono text-[9px] text-stone-400">
              <span>queue 38%</span>
              <span>first token 44%</span>
              <span>gen 18%</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-stone-900/[0.06] bg-white p-4">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-stone-400">
              requests by outcome
            </p>
            <Area data={[30, 36, 34, 44, 41, 52, 49, 61, 58, 67, 63, 74, 70, 81]} id="rl-out" />
          </div>
          <div className="rounded-xl border border-stone-900/[0.06] bg-white p-4">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-stone-400">
              hour-of-day heatmap
            </p>
            <div className="mt-3 max-w-[440px]">
              <Heatmap />
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "capacity",
    label: "Capacity",
    icon: BatteryCharging,
    content: (
      <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-stone-900/[0.06] bg-white p-4">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-stone-400">
              now · saturation
            </p>
            <div className="mt-3 flex items-end justify-between">
              <p className="tnum font-mono text-3xl font-bold text-stone-900">
                <Counter to={71} />%
              </p>
              <p className="tnum font-mono text-[10.5px] text-stone-400">
                312 / 440 rpm
              </p>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-stone-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "71%" }}
                transition={{ duration: 1.3, ease: EASE }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
              />
            </div>
          </div>
          <div className="rounded-xl border border-stone-900/[0.06] bg-white p-4">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-stone-400">
              peak shortfall
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-stone-600">
              Peak demand exceeded configured capacity by{" "}
              <span className="tnum font-mono font-semibold text-stone-900">14 rpm</span>{" "}
              once in the last 30 days — absorbed by the queue.
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-stone-900/[0.06] bg-white p-4">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-stone-400">
            per-key utilization
          </p>
          {[
            ["nvapi-…7f2", 92],
            ["nvapi-…3a9", 71],
            ["sk-or-…91c", 84],
            ["sk-or-…6d0", 63],
            ["tr-…44a", 48],
            ["sk-…b08", 37],
          ].map(([n, v], i) => (
            <HBar key={n as string} name={n as string} value={v as number} max={100} unit="%" />
          ))}
          <p className="font-mono text-[9.5px] text-stone-400">429s/min by key: all lanes 0.0</p>
        </div>
      </div>
    ),
  },
];

/* ------------------------------------------------------------------ */

export function DashboardSection() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive((a) => (a + 1) % TABS.length), 5200);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <section id="dashboard" className="relative overflow-hidden py-14 md:py-20">
      <div
        aria-hidden
        className="absolute right-[-10%] top-24 h-[420px] w-[420px] rounded-full bg-emerald-100/50 blur-[130px]"
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="observability built in"
          title="Stop guessing what your agents are doing."
          sub="Because the proxy sits in the request path for every client and model, it doubles as an agent-observability tool — five persona-aligned tabs, from at-a-glance health to per-key capacity."
          align="center"
        />

        <Reveal delay={0.15}>
          <div
            className="mt-10"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="overflow-hidden rounded-[1.6rem] border border-stone-900/10 bg-[#f5f4f2] shadow-[0_48px_96px_-40px_oklch(0.216_0.008_90/0.3)]">
              {/* browser chrome */}
              <div className="flex items-center gap-3 border-b border-stone-900/[0.07] bg-white px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="mx-auto flex w-full max-w-[300px] items-center justify-center gap-1.5 rounded-lg bg-stone-100 px-3 py-1.5 font-mono text-[10.5px] text-stone-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  localhost:8000
                </div>
                <div className="hidden items-center gap-1 md:flex">
                  {["1h", "24h", "7d", "30d"].map((r, i) => (
                    <span
                      key={r}
                      className={cn(
                        "rounded-md px-2 py-1 font-mono text-[9.5px]",
                        i === 3
                          ? "bg-stone-900 text-stone-50"
                          : "text-stone-400"
                      )}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              {/* tab bar */}
              <div className="flex items-center gap-1 overflow-x-auto border-b border-stone-900/[0.07] bg-white px-3 py-2">
                {TABS.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => setActive(i)}
                    className={cn(
                      "relative flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-medium transition-colors",
                      active === i ? "text-stone-900" : "text-stone-400 hover:text-stone-600"
                    )}
                  >
                    <t.icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                    {t.label}
                    {active === i && (
                      <motion.span
                        layoutId="dash-tab"
                        className="absolute inset-0 -z-10 rounded-lg bg-stone-900/[0.06]"
                        transition={{ type: "spring", stiffness: 320, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
                <span className="ml-auto hidden shrink-0 items-center gap-1.5 pr-2 font-mono text-[9.5px] uppercase tracking-wider text-stone-400 sm:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 heartbeat-dot" />
                  live · 3s refresh
                </span>
              </div>

              {/* content */}
              <div className="p-4 md:p-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={TABS[active].id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    {TABS[active].content}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* privacy band                                                        */
/* ------------------------------------------------------------------ */

export function PrivacyBand() {
  return (
    <section className="relative border-y border-stone-900/[0.07] bg-stone-900 py-14 md:py-20">
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[110px]"
      />
      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-7 px-4 text-center sm:px-6">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.2em] text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 heartbeat-dot" />
            privacy by architecture
          </span>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="text-balance text-3xl font-semibold leading-[1.06] tracking-tighter text-stone-50 md:text-5xl">
            Observe the system.
            <br />
            <span className="text-emerald-400">Not the conversation.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="max-w-[60ch] text-[15px] leading-relaxed text-stone-400 md:text-base">
            Request shape is captured as counts and sizes only — tokens, latency,
            tool usage, sampling fingerprints. Message content is never read,
            never stored, never counted against you.
          </p>
        </Reveal>
        <Reveal delay={0.22}>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-stone-500">
            <span>counts</span>
            <span className="text-stone-700">·</span>
            <span>sizes</span>
            <span className="text-stone-700">·</span>
            <span>latency</span>
            <span className="text-stone-700">·</span>
            <span>tokens</span>
            <span className="text-stone-700">·</span>
            <span className="text-emerald-400">never content</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
