"use client";

import { Code2, Bot, Users2, ServerCog, ArrowUpRight } from "lucide-react";
import { SectionHeading, Reveal } from "./reveal";

const AUDIENCES = [
  {
    icon: Code2,
    title: "AI Developers",
    body: "Stop rewriting your application every time you change providers or rotate API keys. One endpoint, one auth scheme, one retry story.",
    tag: "ship faster",
  },
  {
    icon: Bot,
    title: "Agent Builders",
    body: "Keep OpenCode, Codex, n8n and autonomous agents running through rate limits, stalls and transient failures — without babysitting a single 429.",
    tag: "zero interruptions",
  },
  {
    icon: Users2,
    title: "Teams",
    body: "Share provider capacity across the whole team without sharing credentials. Everyone mints their own client key; nobody sees anyone else's.",
    tag: "pooled throughput",
  },
  {
    icon: ServerCog,
    title: "Infrastructure Teams",
    body: "Centralize routing, limits, reliability and observability behind one self-hosted endpoint with Prometheus metrics and an OpenAPI spec.",
    tag: "one control plane",
  },
];

export function Audience() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="who it's for"
          title="Built for anyone running AI workloads."
          sub="From a solo developer with two free NIM keys to a platform team pooling dozens of upstream accounts."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-12">
          {AUDIENCES.map((a, i) => (
            <Reveal
              key={a.title}
              delay={i * 0.07}
              className={
                i % 2 === 0 ? "md:col-span-7" : "md:col-span-5"
              }
            >
              <div className="group diffuse-card relative flex h-full flex-col gap-4 overflow-hidden rounded-[1.6rem] p-7 transition-transform duration-500 hover:-translate-y-1">
                <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-emerald-100/0 blur-2xl transition-all duration-500 group-hover:bg-emerald-100/60" />
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-600/15 bg-emerald-50">
                    <a.icon className="h-4.5 w-4.5 text-emerald-600" strokeWidth={1.7} />
                  </div>
                  <span className="flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-stone-400">
                    {a.tag}
                    <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.8} />
                  </span>
                </div>
                <h3 className="text-[17px] font-semibold tracking-tight text-stone-900">
                  {a.title}
                </h3>
                <p className="max-w-[52ch] text-[13.5px] leading-relaxed text-stone-500">
                  {a.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
