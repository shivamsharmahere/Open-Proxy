"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gauge,
  RefreshCcw,
  Magnet,
  Crosshair,
  Radio,
  DatabaseZap,
} from "lucide-react";
import { SectionHeading, Reveal } from "./reveal";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* A — sliding-window pacing lanes                                     */
/* ------------------------------------------------------------------ */

function WindowViz() {
  const lanes = [
    { name: "nvapi-…7f2", delay: "0s" },
    { name: "sk-or-…91c", delay: "-1.6s" },
    { name: "tr-…44a", delay: "-3.1s" },
    { name: "sk-…b08", delay: "-4.4s" },
  ];
  return (
    <div className="flex flex-col gap-2.5">
      {lanes.map((lane, i) => (
        <div key={lane.name} className="flex items-center gap-3">
          <span className="w-[86px] shrink-0 font-mono text-[10px] text-stone-400">
            {lane.name}
          </span>
          <div className="relative h-7 flex-1 overflow-hidden rounded-lg border border-stone-900/[0.06] bg-stone-100/80">
            {/* requests ticking in */}
            {[14, 30, 46, 62, 78].map((left, k) => (
              <span
                key={left}
                className="absolute top-1/2 h-2 w-[3px] -translate-y-1/2 rounded-full bg-emerald-500/80"
                style={{
                  left: `${left}%`,
                  animation: `opx-beat 2.8s ease-in-out ${i * 0.4 + k * 0.5}s infinite`,
                }}
              />
            ))}
            {/* the sliding window */}
            <span
              className="absolute inset-y-0 w-[36%] rounded-md border border-emerald-600/40 bg-emerald-100/70"
              style={{ animation: `opx-window 7s ease-in-out ${lane.delay} infinite alternate` }}
            />
          </div>
          <span className="tnum shrink-0 font-mono text-[10px] font-medium text-stone-500">
            40/40
          </span>
        </div>
      ))}
      <style>{`@keyframes opx-window { from { transform: translateX(4%); } to { transform: translateX(178%); } }`}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* B — retry / failover event log                                      */
/* ------------------------------------------------------------------ */

const EVENTS = [
  { text: "429 · key 1 · retry-after 0.8s", tone: "text-amber-600" },
  { text: "failover → key 4 (ready)", tone: "text-stone-500" },
  { text: "200 · stream open · 12 tok/s", tone: "text-emerald-600" },
  { text: "5xx · key 2 · cooldown 4s", tone: "text-amber-600" },
  { text: "affinity spill → key 5", tone: "text-stone-500" },
  { text: "200 · 1,024 tokens · done", tone: "text-emerald-600" },
];

type LoggedEvent = { id: number; text: string; tone: string };

function EventLog() {
  const [visible, setVisible] = useState<LoggedEvent[]>([]);

  useEffect(() => {
    let seq = 0;
    let cursor = 0;
    const t = setInterval(() => {
      const next = EVENTS[cursor % EVENTS.length];
      cursor += 1;
      seq += 1;
      setVisible((prev) => [...prev.slice(-3), { ...next, id: seq }]);
    }, 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex h-[132px] flex-col justify-end gap-1.5 overflow-hidden rounded-xl border border-stone-900/[0.06] bg-stone-50 px-3.5 py-3 font-mono text-[11px]">
      <AnimatePresence initial={false}>
        {visible.map((e) => (
          <motion.p
            key={e.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className={e.tone}
          >
            {e.text}
          </motion.p>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* C — conversation affinity                                           */
/* ------------------------------------------------------------------ */

function AffinityViz() {
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex h-[120px] w-[150px] gap-2">
        {[0, 1, 2, 3].map((l) => (
          <div
            key={l}
            className="relative flex-1 rounded-lg border border-stone-900/[0.06] bg-stone-100/80"
          >
            <span className="absolute bottom-1.5 left-0 right-0 text-center font-mono text-[8px] uppercase text-stone-400">
              k{l + 1}
            </span>
            {l === 1 && (
              <span className="absolute left-1/2 top-2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-emerald-500/70" />
            )}
          </div>
        ))}
        <motion.span
          className="absolute top-4 h-3.5 w-3.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_oklch(0.6_0.14_155/0.18)]"
          animate={{ left: ["36%", "36%", "64%", "36%"] }}
          transition={{ duration: 6, times: [0, 0.52, 0.62, 0.94], repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <div className="flex flex-col gap-1.5 whitespace-nowrap font-mono text-[10.5px] leading-relaxed">
        <span className="flex items-center gap-1.5 text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> sticky · warm cache
        </span>
        <span className="flex items-center gap-1.5 text-stone-400">
          <span className="h-1.5 w-1.5 rounded-full bg-stone-300" /> spill · key full
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* D — model-pressure governor                                         */
/* ------------------------------------------------------------------ */

function GovernorViz() {
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 120 70" className="h-[86px] w-[130px]">
        <path
          d="M12 62 A 48 48 0 0 1 108 62"
          fill="none"
          stroke="oklch(0.216 0.008 90 / 0.08)"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M12 62 A 48 48 0 0 1 108 62"
          fill="none"
          stroke="oklch(0.6 0.14 155)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray="151"
          strokeDashoffset="55"
        />
        <g style={{ transformOrigin: "60px 62px", animation: "opx-needle 5s ease-in-out infinite alternate" }}>
          <line x1="60" y1="62" x2="60" y2="24" stroke="oklch(0.216 0.008 90)" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="60" cy="62" r="4.5" fill="oklch(0.216 0.008 90)" />
        </g>
        <style>{`@keyframes opx-needle { from { transform: rotate(-38deg); } to { transform: rotate(26deg); } }`}</style>
      </svg>
      <div className="flex flex-col gap-1.5 font-mono text-[10.5px] leading-relaxed">
        <span className="text-stone-500">
          model limit <span className="font-semibold text-stone-800">8 workers</span>
        </span>
        <span className="text-stone-400">healthy keys untouched</span>
        <span className="text-emerald-700">governed adaptively</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* E — SSE heartbeats                                                  */
/* ------------------------------------------------------------------ */

function HeartbeatViz() {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-px w-full bg-stone-200">
        {[8, 28, 48, 68, 88].map((left, i) => (
          <span
            key={left}
            className="heartbeat-dot absolute -top-[3px] h-[7px] w-[7px] rounded-full bg-emerald-500"
            style={{ left: `${left}%`, animationDelay: `${i * 0.32}s` }}
          />
        ))}
      </div>
      <div className="font-mono text-[11px] leading-relaxed">
        <p className="text-stone-400">HTTP/1.1 200 OK · text/event-stream</p>
        <p className="text-emerald-700">: heartbeat</p>
        <p className="text-stone-400">
          : heartbeat <span className="term-caret ml-1 inline-block h-3 w-[6px] translate-y-[2px] bg-stone-400" />
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* F — catalog cache ticker                                            */
/* ------------------------------------------------------------------ */

const MODELS = [
  "moonshotai/kimi-k2-instruct",
  "deepseek-ai/deepseek-r1",
  "qwen/qwen3-235b-a22b",
  "meta/llama-3.3-70b-instruct",
  "openai/gpt-4o",
  "mistralai/mistral-large",
];

function CatalogViz() {
  const row = [...MODELS, ...MODELS];
  return (
    <div className="relative flex items-center gap-4 overflow-hidden">
      <span className="z-10 flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-600/25 bg-emerald-50 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 heartbeat-dot" />
        cache hit · 0 rpm spent
      </span>
      <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
        <div className="animate-marquee flex w-max gap-2.5" style={{ animationDuration: "22s" }}>
          {row.map((m, i) => (
            <span
              key={`${m}-${i}`}
              className="whitespace-nowrap rounded-lg border border-stone-900/[0.07] bg-white px-3 py-1.5 font-mono text-[11px] text-stone-600"
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* bento shell                                                         */
/* ------------------------------------------------------------------ */

function Card({
  icon: Icon,
  title,
  body,
  children,
  className,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <Reveal delay={delay} className={className}>
      <div className="diffuse-card group flex h-full flex-col gap-5 rounded-[1.6rem] p-6 transition-transform duration-500 hover:-translate-y-1 md:p-7">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-600/15 bg-emerald-50">
            <Icon className="h-4 w-4 text-emerald-600" strokeWidth={1.7} />
          </div>
          <h3 className="text-[15.5px] font-semibold tracking-tight text-stone-900">
            {title}
          </h3>
        </div>
        <div className="flex-1 rounded-xl">{children}</div>
        <p className="text-[13.5px] leading-relaxed text-stone-500">{body}</p>
      </div>
    </Reveal>
  );
}

export function Bento() {
  return (
    <section id="features" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="outcomes, not plumbing"
          title="Never babysit a 429 again."
          sub="Pacing, queueing, affinity, failover, governing, heartbeats and caching — seven moving parts working together behind one endpoint, so rate limits become your problem exactly zero times."
        />

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-12">
          <Card
            icon={Gauge}
            title="Rate-limit aware"
            body="Every key gets its own exact sliding window — matched to the upstream's real limit, with a 1-second jitter margin. Requests are queued instead of blindly thrown at the provider."
            className="md:col-span-7"
            delay={0}
          >
            <WindowViz />
          </Card>

          <Card
            icon={RefreshCcw}
            title="Retries & failover"
            body="429s and upstream 5xx never become application failures. Wait, honor Retry-After, move to a healthy key — automatically."
            className="md:col-span-5"
            delay={0.08}
          >
            <EventLog />
          </Card>

          <Card
            icon={Magnet}
            title="Conversation affinity"
            body="Same conversation, same key — upstream prefix caches stay warm. Traffic spills to the least-loaded key only when it has to."
            className="md:col-span-4"
            delay={0}
          >
            <AffinityViz />
          </Card>

          <Card
            icon={Crosshair}
            title="Model-pressure aware"
            body="Per-model worker ceilings are detected and governed adaptively — healthy key capacity is never wasted on a saturated model."
            className="md:col-span-4"
            delay={0.08}
          >
            <GovernorViz />
          </Card>

          <Card
            icon={Radio}
            title="Heartbeats, not timeouts"
            body="Streaming requests commit 200 immediately and emit SSE heartbeats while they wait for a slot. Clients never time out in the queue."
            className="md:col-span-4"
            delay={0.16}
          >
            <HeartbeatViz />
          </Card>

          <Card
            icon={DatabaseZap}
            title="A catalog that costs nothing"
            body="GET /v1/models is answered from cache with single-flight refresh, so client catalog polls never burn a single request of rate budget."
            className="md:col-span-12"
            delay={0.1}
          >
            <CatalogViz />
          </Card>
        </div>

        <Reveal delay={0.1}>
          <p className={cn("mt-10 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-stone-400")}>
            bodies pass through untouched — the api is your provider's, the patience is ours
          </p>
        </Reveal>
      </div>
    </section>
  );
}
