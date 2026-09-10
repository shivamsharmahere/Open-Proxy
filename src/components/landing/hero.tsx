"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Github,
  Terminal,
  ArrowDown,
  Blocks,
  Gauge,
  Route,
  RefreshCw,
  Zap,
  Layers,
  Timer,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Copy,
  Check,
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

/* wire geometry in viewBox space (1200 × 440) — one per provider,
   stroke width scales with the provider's rpm contribution          */
const WIRES = [
  "M 252 62 C 348 62, 372 148, 458 154",
  "M 252 166 C 344 166, 370 192, 458 192",
  "M 252 270 C 344 270, 370 244, 458 244",
  "M 252 374 C 348 374, 372 288, 458 282",
];

/* the one thick stream — runs from the core all the way into the hub */
const STREAM = "M 716 218 C 800 218, 890 218, 962 218";

/* orbit geometry in viewBox space */
const ORBIT_CX = 1000;
const ORBIT_CY = 218;
const ORBIT_R = 150;

const STAGES = [
  { n: "01", t: "upstream pools", left: "11%" },
  { n: "02", t: "one endpoint", left: "47.9%" },
  { n: "03", t: "pooled throughput", left: "69.9%" },
  { n: "04", t: "every agent", left: "84.2%" },
];

const EVENTS = [
  { text: "POST /v1/chat/completions → nim-1 · 200 OK · 41ms", tone: "ok" },
  { text: "POST /v1/chat/completions → tokenrouter-1 · 200 OK · 55ms", tone: "ok" },
  { text: "openrouter-2 · 429 absorbed · retry scheduled +1.2s", tone: "warn" },
  { text: "POST /v1/chat/completions → nim-2 · 200 · streamed 1.2k tok", tone: "ok" },
  { text: "failover: nim-1 → openrouter-1 · affinity kept", tone: "info" },
  { text: "POST /v1/chat/completions → others-3 · 200 OK · 47ms", tone: "ok" },
  { text: "pace: pooled rpm budget shared · 0 requests dropped", tone: "info" },
] as const;

const STATS = [
  { icon: Zap, v: "1000+ RPM", l: "pooled throughput" },
  { icon: Layers, v: "12 keys", l: "across 4 upstreams" },
  { icon: Timer, v: "+1.8ms", l: "p95 pacing overhead" },
  { icon: ShieldCheck, v: "MIT", l: "self-hosted · fail-closed" },
];

const TONE_DOT: Record<string, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  info: "bg-sky-500",
};

/* ------------------------------------------------------------------ */
/* live state hooks (client-only intervals, deterministic first paint) */
/* ------------------------------------------------------------------ */

function useLiveStats() {
  const [reqs, setReqs] = useState(12408);
  const [blocked, setBlocked] = useState(331);
  useEffect(() => {
    const a = setInterval(
      () => setReqs((r) => r + 1 + Math.floor(Math.random() * 6)),
      700
    );
    const b = setInterval(
      () => setBlocked((v) => v + (Math.random() < 0.6 ? 1 : 0)),
      5200
    );
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, []);
  return { reqs, blocked };
}

function useEventTicker() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % EVENTS.length), 2600);
    return () => clearInterval(t);
  }, []);
  return EVENTS[idx];
}

/* deterministic PRNG so SSR and client render the same sparkline */
function seededPoints(): number[] {
  let s = 7;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const pts: number[] = [];
  let v = 146;
  for (let i = 0; i < 44; i++) {
    v += (rand() - 0.47) * 10;
    v = Math.max(128, Math.min(172, v));
    pts.push(v);
  }
  pts[12] = Math.max(pts[12], 166);
  pts[31] = Math.max(pts[31], 169);
  return pts;
}

function buildSpark(pts: number[]) {
  const W = 300;
  const H = 64;
  const P = 5;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const step = (W - 2 * P) / (pts.length - 1);
  const xy = pts.map(
    (v, i) => [P + i * step, P + (H - 2 * P) * (1 - (v - min) / span)] as const
  );
  let line = `M ${xy[0][0].toFixed(1)} ${xy[0][1].toFixed(1)}`;
  for (let i = 0; i < xy.length - 1; i++) {
    const p0 = xy[Math.max(0, i - 1)];
    const p1 = xy[i];
    const p2 = xy[i + 1];
    const p3 = xy[Math.min(xy.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    line += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  const area = `${line} L ${xy[xy.length - 1][0].toFixed(1)} ${H} L ${xy[0][0].toFixed(1)} ${H} Z`;
  const ceilingY = P + (H - 2 * P) * (1 - (166 - min) / span);
  return { line, area, last: xy[xy.length - 1], ceilingY };
}

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
  const pct = Math.round((p.rpm / 80) * 100);
  return (
    <div
      className={cn(
        "diffuse-card float-y relative overflow-hidden rounded-2xl px-4 pb-4 pt-3",
        compact && "px-3 pb-3.5 pt-2.5"
      )}
      style={{ animationDelay: `${i * 0.7}s` }}
    >
      <div className="flex items-center gap-3">
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
            {compact ? p.short : p.name}
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
      {/* rpm share bar */}
      <div
        className={cn(
          "absolute inset-x-4 bottom-2 h-[3px] overflow-hidden rounded-full bg-stone-100",
          compact && "inset-x-3 bottom-1.5"
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.45 + i * 0.13, duration: 1, ease: EASE }}
          className="h-full rounded-full bg-gradient-to-r from-emerald-600/85 to-emerald-400"
        />
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
    <div className="relative">
      {/* slow-spinning dashed status ring */}
      <div
        aria-hidden
        className="core-ring absolute -inset-3 rounded-[2rem] border border-dashed border-emerald-600/25"
      />
      <div
        aria-hidden
        className="absolute -inset-7 rounded-[2.6rem] bg-emerald-200/25 blur-2xl"
      />
      <div className="core-pulse diffuse-card relative flex w-[250px] flex-col gap-3 rounded-[1.6rem] px-5 py-4">
        <div className="flex items-center justify-between gap-2">
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
          <span className="flex shrink-0 items-center gap-1.5 rounded-md border border-emerald-600/20 bg-emerald-50 px-1.5 py-1 font-mono text-[8.5px] font-semibold uppercase tracking-wider text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 heartbeat-dot" />
            4/4 up
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {chips.map((c) => (
            <span
              key={c.label}
              className="flex flex-col items-center gap-1 rounded-lg border border-stone-900/[0.07] bg-stone-50 px-1.5 py-2"
            >
              <c.icon className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.8} />
              <span className="font-mono text-[8px] uppercase tracking-wide text-stone-500">
                {c.label}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClientChip({
  name,
  compact,
  flash,
  flashKey,
}: {
  name: string;
  compact?: boolean;
  flash?: "served" | "retry" | null;
  flashKey?: number;
}) {
  return (
    <div
      className={cn(
        "diffuse-card chip-flash relative flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-600/15 bg-white px-3 py-1.5",
        compact ? "text-[10px]" : "text-[11.5px]",
        flash === "served" && "chip-served",
        flash === "retry" && "chip-retry chip-shake"
      )}
    >
      <span
        className={cn(
          "h-1 w-1 rounded-full transition-colors",
          flash === "retry" ? "bg-amber-500" : "bg-emerald-500/70",
          flash === "served" && "chip-dot-burst"
        )}
      />
      <span className="font-mono font-medium text-stone-700">{name}</span>

      {/* power-up burst — fires the moment this chip touches the stream */}
      {flash === "served" ? (
        <>
          <span
            key={`ring-${flashKey}`}
            aria-hidden
            className="chip-burst-ring absolute inset-0 rounded-full border-2 border-emerald-400/70"
          />
          <span
            key={`zap-${flashKey}`}
            aria-hidden
            className="zap-pop absolute -right-1 -top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_4px_12px_-2px_oklch(0.6_0.14_155/0.65)]"
          >
            <Zap className="h-2.5 w-2.5" strokeWidth={2.6} />
          </span>
        </>
      ) : null}
    </div>
  );
}

/* the client ring rotates clockwise at 38s/turn, so each chip meets the
   emerald stream intake (left, 180°) at a computable animation-time — we
   read the live CSS animation clock and power up each chip exactly at
   contact, immune to hydration/wall-clock drift */
const SPIN_MS = 38000;
const CONTACT_CROSSINGS = CLIENTS.map((_, i) => {
  const theta = (i / CLIENTS.length) * 360 - 90; /* chip's angle on ring */
  const phi = (((180 - theta) % 360) + 360) % 360; /* rotation at contact */
  return { chip: i, at: (phi / 360) * SPIN_MS };
}).sort((a, b) => a.at - b.at);

/* ------------------------------------------------------------------ */
/* shared live rpm meter — one store drives every live readout          */
/* (desktop hub, mobile hub, mobile stream badge) so they never         */
/* disagree. counts 0 -> 166 on first reveal, then keeps climbing as    */
/* keys connect, breathes around the current ceiling and surges when    */
/* a client powers up on the stream                                     */
/* ------------------------------------------------------------------ */

const RPM_START = 166; /* demo pool — the meter keeps climbing as keys connect */
const RPM_MAX = 999;

let rpmValue = 0;
let rpmCap = RPM_START; /* current pooled ceiling; grows as keys connect */
let rpmArmed = false;
let rpmDriftT: ReturnType<typeof setTimeout> | undefined;
let rpmGrowT: ReturnType<typeof setTimeout> | undefined;
const rpmSubs = new Set<(v: number) => void>();

function emitRpm() {
  rpmSubs.forEach((fn) => fn(rpmValue));
}

function subscribeRpm(fn: (v: number) => void) {
  rpmSubs.add(fn);
  fn(rpmValue);
  return () => {
    rpmSubs.delete(fn);
  };
}

/* first visible meter arms the store: 0 -> capacity over 2.2s, then drift */
function armRpm() {
  if (rpmArmed) return;
  rpmArmed = true;
  const D = 2200;
  const t0 = performance.now();
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / D);
    rpmValue = Math.round(RPM_START * (1 - Math.pow(1 - p, 3)));
    emitRpm();
    if (p < 1) requestAnimationFrame(step);
    else {
      driftTick(900);
      growTick(7000);
    }
  };
  requestAnimationFrame(step);
}

/* mean-reverting random walk around capacity — reads like a real meter */
function driftTick(delay: number) {
  if (rpmDriftT !== undefined) return;
  rpmDriftT = setTimeout(() => {
    rpmDriftT = undefined;
    const pull = Math.round((rpmCap - rpmValue) * 0.45);
    const noise = Math.floor(Math.random() * 5) - 2; /* -2..+2 */
    rpmValue = Math.max(
      rpmCap - 6,
      Math.min(rpmCap + 2, rpmValue + pull + noise)
    );
    emitRpm();
    driftTick(1500 + Math.random() * 1300);
  }, delay);
}

/* keys/providers get connected over time — the pooled ceiling ratchets up */
function growTick(delay: number) {
  if (rpmGrowT !== undefined) return;
  rpmGrowT = setTimeout(() => {
    rpmGrowT = undefined;
    if (rpmCap < RPM_MAX) {
      const step = rpmCap > 900 ? 1 : 2 + Math.floor(Math.random() * 4);
      rpmCap = Math.min(RPM_MAX, rpmCap + step);
      rpmValue = rpmCap; /* pool grew — meter steps up to its new ceiling */
      emitRpm();
    }
    growTick(8000 + Math.random() * 6000);
  }, delay);
}

/* power-up surge — a served request kicks the meter, drift decays it back */
function surgeRpm() {
  if (!rpmArmed || rpmValue < RPM_START - 20) return; /* still counting up */
  rpmValue = Math.min(
    rpmCap + 5,
    rpmValue + 1 + Math.floor(Math.random() * 2)
  );
  emitRpm();
}

/* live rpm readout — every instance on the page shows the same value */
function LiveRpm({ className }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [v, setV] = useState(0);

  useEffect(() => {
    if (inView) armRpm();
  }, [inView]);

  useEffect(() => subscribeRpm(setV), []);

  return (
    <span ref={ref} className={cn("tnum", className)}>
      {v}
    </span>
  );
}

function Orbit({ scale = 1 }: { scale?: number }) {
  const compact = scale < 1;
  const [flash, setFlash] = useState<{
    i: number;
    mode: "served" | "retry";
    count: number;
  } | null>(null);

  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let idx = 0;
    let cycle = 0;
    let count = 0;
    let raf = 0;
    let retryT: ReturnType<typeof setTimeout> | undefined;

    /* align our clock with the ring's actual CSS animation time */
    const anim = ringRef.current?.getAnimations?.()[0];
    const animT =
      anim && typeof anim.currentTime === "number" ? anim.currentTime : 0;
    const t0 = performance.now() - animT;

    const tick = (now: number) => {
      const t = now - t0;
      const target = CONTACT_CROSSINGS[idx].at + cycle * SPIN_MS;
      if (t >= target) {
        const i = CONTACT_CROSSINGS[idx].chip;
        idx += 1;
        if (idx >= CONTACT_CROSSINGS.length) {
          idx = 0;
          cycle += 1;
        }
        count += 1;
        if (count % 4 === 0) {
          /* every 4th contact: a 429 gets absorbed, retried, then powered */
          setFlash({ i, mode: "retry", count });
          retryT = setTimeout(() => {
            setFlash({ i, mode: "served", count: count + 0.5 });
            surgeRpm(); /* the late-served request still adds throughput */
          }, 550);
        } else {
          setFlash({ i, mode: "served", count });
          surgeRpm(); /* meter kicks the instant a client powers up */
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (retryT) clearTimeout(retryT);
    };
  }, []);

  return (
    <div
      className="relative"
      style={{ width: 2 * ORBIT_R * scale, height: 2 * ORBIT_R * scale }}
    >
      {/* rings */}
      <div className="absolute inset-0 rounded-full border border-dashed border-stone-900/15" />
      <div className="absolute inset-[17%] rounded-full border border-stone-900/[0.07]" />
      {/* radar dot on inner ring */}
      <div className="core-ring absolute inset-[17%]">
        <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_oklch(0.7_0.14_155/0.45)]" />
      </div>
      {/* hub — the stream plugs in here, carrying the combined figure */}
      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        {flash ? (
          <span
            key={flash.count}
            aria-hidden
            className="hit-ring absolute left-1/2 top-1/2 h-[4.7rem] w-[4.7rem] rounded-2xl border-2 border-emerald-400/60"
          />
        ) : null}
        <div className="hub-pulse flex h-[4.7rem] w-[4.7rem] flex-col items-center justify-center rounded-2xl border border-emerald-600/25 bg-white shadow-[0_14px_28px_-12px_oklch(0.6_0.14_155/0.45)]">
          <Terminal
            className={cn("text-emerald-600", compact ? "h-3.5 w-3.5" : "h-4 w-4")}
            strokeWidth={1.7}
          />
          <span
            className={cn(
              "tnum mt-0.5 font-mono font-bold leading-none text-emerald-700",
              compact ? "text-[12px]" : "text-[15px]"
            )}
          >
            <LiveRpm />
          </span>
          <span
            className={cn(
              "font-mono uppercase tracking-[0.13em] text-stone-400",
              compact ? "text-[6px]" : "mt-[3px] text-[7px]"
            )}
          >
            rpm combined
          </span>
        </div>
      </div>
      {/* revolving clients */}
      <div ref={ringRef} className="orbit-ring absolute inset-0">
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
                <ClientChip
                  name={c}
                  compact={compact}
                  flash={flash?.i === i ? flash.mode : null}
                  flashKey={flash?.count}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* topology panel shell — header, stage slot, live event ticker        */
/* ------------------------------------------------------------------ */

function TopologyPanel({ children }: { children: ReactNode }) {
  const { reqs, blocked } = useLiveStats();
  const evt = useEventTicker();
  return (
    <div className="diffuse-card relative overflow-hidden rounded-[1.8rem]">
      {/* header */}
      <div className="relative z-10 flex items-center justify-between gap-3 border-b border-stone-900/[0.06] bg-white/60 px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-600">
            live topology
          </span>
        </div>
        <p className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400 md:block">
          4 upstreams · 12 keys · <span className="text-emerald-600">∞ headroom</span>
        </p>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg border border-stone-900/[0.08] bg-white px-2.5 py-1 font-mono text-[10px] text-stone-500">
            <Zap className="h-3 w-3 text-emerald-600" strokeWidth={2} />
            <span
              key={reqs}
              className="tick-in tnum font-semibold text-stone-900"
            >
              {reqs.toLocaleString("en-US")}
            </span>
            <span className="hidden sm:inline">routed</span>
          </span>
          <span className="hidden items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-50 px-2.5 py-1 font-mono text-[10px] text-amber-700 sm:flex">
            <ShieldAlert className="h-3 w-3" strokeWidth={2} />
            <span className="tnum font-semibold">{blocked}</span>
            <span className="hidden md:inline">429 absorbed</span>
          </span>
        </div>
      </div>

      {children}

      {/* footer — live event ticker */}
      <div className="relative z-10 flex items-center justify-between gap-4 border-t border-stone-900/[0.06] bg-white/60 px-4 py-2.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              TONE_DOT[evt.tone]
            )}
          />
          <p key={evt.text} className="tick-in truncate font-mono text-[11px] text-stone-500">
            <span className="text-stone-300">$ </span>
            {evt.text}
          </p>
        </div>
        <p className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-stone-400 lg:block">
          p95 +1.8ms · fail-closed
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* desktop diagram stage (aspect-locked: svg + html always align)      */
/* ------------------------------------------------------------------ */

function HeroDiagramDesktop() {
  return (
    <div className="hidden lg:block">
      <TopologyPanel>
      <div className="relative aspect-[1200/440] w-full">
        {/* stage backdrop */}
        <div className="stage-dots absolute inset-0" aria-hidden />
        <div
          aria-hidden
          className="absolute left-[30%] top-[24%] h-[55%] w-[42%] rounded-full bg-emerald-100/50 blur-[80px]"
        />
        {/* corner crosshairs */}
        {[
          "left-[1.5%] top-[7%]",
          "right-[1.5%] top-[7%]",
          "left-[1.5%] bottom-[9%]",
          "right-[1.5%] bottom-[9%]",
        ].map((pos) => (
          <Plus
            key={pos}
            aria-hidden
            className={`absolute ${pos} h-3 w-3 text-stone-300`}
            strokeWidth={1.5}
          />
        ))}

        {/* wires + stream + rings */}
        <svg
          viewBox="0 0 1200 440"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="streamGrad"
              gradientUnits="userSpaceOnUse"
              x1="716"
              y1="218"
              x2="962"
              y2="218"
            >
              <stop offset="0%" stopColor="#047857" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* orbit rings */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.8 }}
          >
            <circle
              cx={ORBIT_CX}
              cy={ORBIT_CY}
              r={ORBIT_R}
              fill="none"
              stroke="#1c1917"
              strokeOpacity="0.14"
              strokeWidth="1.2"
              strokeDasharray="3 7"
            />
            <circle
              cx={ORBIT_CX}
              cy={ORBIT_CY}
              r={ORBIT_R * 0.67}
              fill="none"
              stroke="#1c1917"
              strokeOpacity="0.07"
              strokeWidth="1"
            />
          </motion.g>

          {/* provider wires — width encodes rpm contribution */}
          {WIRES.map((d, i) => {
            const rpm = PROVIDERS[i].rpm;
            const w = 1.8 + rpm / 26;
            const packetR = 2.4 + rpm / 44;
            return (
              <g key={d}>
                {/* faint static base */}
                <path
                  d={d}
                  fill="none"
                  stroke="#1c1917"
                  strokeOpacity="0.1"
                  strokeWidth="1.2"
                />
                {/* draw-in colored path */}
                <motion.path
                  d={d}
                  fill="none"
                  stroke="#059669"
                  strokeOpacity="0.7"
                  strokeWidth={w}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.25 + i * 0.13, duration: 0.9, ease: EASE }}
                />
                {/* flowing dashes + packets */}
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.05 + i * 0.13, duration: 0.5 }}
                >
                  <path
                    d={d}
                    fill="none"
                    stroke="#34d399"
                    strokeOpacity="0.7"
                    strokeWidth={w * 0.55}
                    strokeLinecap="round"
                    className="wire-flow"
                    style={{ animationDelay: `${i * 0.22}s` }}
                  />
                  {[0, 1].map((k) => (
                    <g key={k}>
                      <circle r={packetR + 2.6} fill="#10b981" opacity="0.22" />
                      <circle r={packetR} fill="#059669" />
                      <animateMotion
                        dur="2s"
                        begin={`${-(i * 0.45 + k * 1)}s`}
                        repeatCount="indefinite"
                        path={d}
                      />
                    </g>
                  ))}
                </motion.g>
              </g>
            );
          })}

          {/* the one thick stream — glow + drawn body + shimmer + packets */}
          <motion.path
            d={STREAM}
            fill="none"
            stroke="#10b981"
            strokeOpacity="0.16"
            strokeWidth="30"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.6 }}
          />
          <motion.path
            d={STREAM}
            fill="none"
            stroke="url(#streamGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 1.05, duration: 0.85, ease: EASE }}
          />
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.65, duration: 0.5 }}
          >
            <path
              d={STREAM}
              fill="none"
              stroke="#d1fae5"
              strokeOpacity="0.85"
              strokeWidth="5"
              strokeLinecap="round"
              className="stream-flow"
            />
            {[0, 1, 2].map((k) => (
              <g key={k}>
                <circle r="8.5" fill="#10b981" opacity="0.25" />
                <circle r="4.6" fill="#a7f3d0" />
                <animateMotion
                  dur="1.25s"
                  begin={`${-k * 0.42}s`}
                  repeatCount="indefinite"
                  path={STREAM}
                />
              </g>
            ))}
          </motion.g>
        </svg>

        {/* provider cards */}
        {PROVIDERS.map((p, i) => (
          <div
            key={p.name}
            className="absolute w-[21%]"
            style={{ left: "0.5%", top: `${(18 + i * 104) / 4.4}%` }}
          >
            <ProviderCard p={p} i={i} />
          </div>
        ))}

        {/* proxy core */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: "48.3%", top: "49.5%" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.8, ease: EASE }}
          >
            <ProxyCore />
          </motion.div>
        </div>

        {/* orbit of clients */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${(ORBIT_CX / 1200) * 100}%`,
            top: `${(ORBIT_CY / 440) * 100}%`,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.35, duration: 0.9, ease: EASE }}
          >
            <Orbit />
          </motion.div>
        </div>

        {/* stage captions */}
        {STAGES.map((s) => (
          <div
            key={s.n}
            className="absolute bottom-[1%] -translate-x-1/2 text-center"
            style={{ left: s.left }}
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">
              <span className="font-semibold text-emerald-600">{s.n}</span> · {s.t}
            </p>
          </div>
        ))}
      </div>
    </TopologyPanel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* mobile diagram                                                      */
/* ------------------------------------------------------------------ */

function HeroDiagramMobile() {
  return (
    <div className="lg:hidden">
      <TopologyPanel>
        <div className="flex flex-col items-center gap-5 px-4 py-6">
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
                stroke="#34d399"
                strokeOpacity="0.8"
                strokeWidth="1.6"
                className="wire-flow"
              />
            </svg>
            <ArrowDown className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.8} />
          </div>

          <ProxyCore />

          <div className="relative flex w-full max-w-[320px] flex-col items-center">
            <div className="h-3.5 w-full overflow-hidden rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400">
              <div className="stream-flow absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_14px,oklch(0.98_0.02_155/0.75)_14px,oklch(0.98_0.02_155/0.75)_24px)]" />
            </div>
            <div className="glass absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl px-3 py-1.5 text-center">
              <p className="tnum font-mono text-sm font-bold leading-none text-emerald-700">
                <LiveRpm /> <span className="text-[9px] font-semibold uppercase tracking-wider text-stone-500">rpm combined</span>
              </p>
            </div>
          </div>

          <div className="mt-4 scale-[0.68]">
            <Orbit />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
            {STAGES.map((s) => (
              <p
                key={s.n}
                className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-stone-400"
              >
                <span className="font-semibold text-emerald-600">{s.n}</span> · {s.t}
              </p>
            ))}
          </div>
        </div>
      </TopologyPanel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* hero right stat card                                                */
/* ------------------------------------------------------------------ */

function RpmCard() {
  const bars = PROVIDERS;
  const pts = useMemo(() => seededPoints(), []);
  const spark = useMemo(() => buildSpark(pts), [pts]);
  const [util, setUtil] = useState(158);
  useEffect(() => {
    const t = setInterval(() => setUtil(152 + Math.floor(Math.random() * 14)), 2100);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="diffuse-card relative overflow-hidden rounded-[1.6rem] p-6">
      <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-stone-400">
          combined capacity
        </p>
        <span className="flex items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-50 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 heartbeat-dot" />
          live
        </span>
      </div>
      <div className="mt-2 flex items-end gap-3">
        <span className="font-mono text-[4.6rem] font-bold leading-[0.85] tracking-tighter text-stone-900">
          ∞
        </span>
        <div className="pb-1.5">
          <p className="tnum font-mono text-sm font-semibold text-emerald-700">
            <Counter to={1000} suffix="+" /> rpm at scale
          </p>
          <p className="text-[12px] leading-snug text-stone-500">
            no fixed ceiling — the pool
            <br />
            grows with every key you add
          </p>
        </div>
      </div>

      {/* live utilization sparkline */}
      <div className="mt-5 flex items-center justify-between">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-stone-400">
          pool utilization · last 60s
        </p>
        <p className="tnum font-mono text-[11px] font-semibold text-emerald-700">
          {util} rpm
        </p>
      </div>
      <svg
        viewBox="0 0 300 64"
        preserveAspectRatio="none"
        className="mt-1.5 h-16 w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* demo-pool ceiling reference */}
        <line
          x1="5"
          x2="295"
          y1={spark.ceilingY}
          y2={spark.ceilingY}
          stroke="#a8a29e"
          strokeOpacity="0.55"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
        <text
          x="295"
          y={spark.ceilingY - 4}
          textAnchor="end"
          fontSize="7.5"
          fill="#a8a29e"
          className="font-mono"
          letterSpacing="0.08em"
        >
          POOL CEILING
        </text>
        <motion.path
          d={spark.area}
          fill="url(#sparkFill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 1 }}
        />
        <motion.path
          d={spark.line}
          fill="none"
          stroke="#059669"
          strokeWidth="1.8"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.45, duration: 1.5, ease: EASE }}
        />
        <circle
          cx={spark.last[0]}
          cy={spark.last[1]}
          r="3"
          fill="#059669"
          className="heartbeat-dot"
        />
      </svg>

      <div className="mt-4 flex flex-col gap-2.5">
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
        80 + 40 + 16 + 50 — a demo pool.{" "}
        <span className="font-semibold text-stone-600">stack keys and it scales past 1000 rpm</span>{" "}
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
                    stroke="#10b981"
                    strokeOpacity="0.55"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 8.5 C 70 4.5, 148 4, 212 7.5"
                    stroke="#059669"
                    strokeOpacity="0.3"
                    strokeWidth="1.8"
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

            {/* live stat strip */}
            <div className="grid w-full max-w-xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-stone-900/[0.08] bg-stone-900/[0.06] sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.l} className="flex flex-col gap-0.5 bg-white/90 px-4 py-3">
                  <span className="flex items-center gap-1.5 font-mono text-[13px] font-semibold tracking-tight text-stone-900">
                    <s.icon className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.9} />
                    {s.v}
                  </span>
                  <span className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-stone-400">
                    {s.l}
                  </span>
                </div>
              ))}
            </div>
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

