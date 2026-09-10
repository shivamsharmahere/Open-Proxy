"use client";

import {
  Feather,
  Box,
  UserRound,
  Activity,
  FileCode2,
  HeartHandshake,
  KeyRound,
  Users,
  ShieldCheck,
  Lock,
  MonitorDot,
  Ban,
  Fingerprint,
} from "lucide-react";
import { SectionHeading, Reveal, Counter } from "./reveal";

/* ------------------------------------------------------------------ */
/* infrastructure stat strip                                           */
/* ------------------------------------------------------------------ */

const STATS = [
  {
    icon: Feather,
    value: 5,
    prefix: "~",
    suffix: " MB",
    label: "static musl binary",
    note: "TLS roots compiled in",
  },
  {
    icon: Box,
    value: 0,
    suffix: " libc",
    label: "FROM scratch",
    note: "no shell, no CA bundle",
  },
  {
    icon: UserRound,
    value: 0,
    suffix: " root",
    label: "rootless runtime",
    note: "read_only · cap_drop ALL",
  },
  {
    icon: Activity,
    value: 30,
    suffix: "+",
    label: "prometheus series",
    note: "native /metrics endpoint",
  },
  {
    icon: FileCode2,
    value: 17,
    suffix: "",
    label: "openapi operations",
    note: "generated from handlers",
  },
  {
    icon: HeartHandshake,
    value: 100,
    suffix: "%",
    label: "signed releases",
    note: "cosign · SLSA · SBOM",
  },
];

export function Infra() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="production posture"
          title={
            <>
              Small enough to run anywhere.
              <br />
              <span className="text-stone-400">Serious enough for production.</span>
            </>
          }
          sub="A single static binary with hardened defaults. No Grafana, no frontend build, no runtime dependencies — the dashboard, metrics and catalogs are embedded at compile time."
        />

        <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-[1.6rem] border border-stone-900/[0.07] bg-stone-900/[0.07] md:grid-cols-3 lg:grid-cols-6">
          {STATS.map((s, i) => (
            <Reveal
              key={s.label}
              delay={i * 0.06}
              className="bg-white"
            >
              <div className="group flex h-full flex-col gap-3 p-5 transition-colors hover:bg-emerald-50/40">
                <s.icon
                  className="h-4.5 w-4.5 text-stone-300 transition-colors group-hover:text-emerald-600"
                  strokeWidth={1.6}
                />
                <p className="tnum font-mono text-[26px] font-bold leading-none tracking-tight text-stone-900">
                  {s.prefix}
                  <Counter to={s.value} />
                  <span className="text-[13px] font-medium text-stone-400">{s.suffix}</span>
                </p>
                <div className="mt-auto leading-tight">
                  <p className="text-[12px] font-semibold text-stone-700">{s.label}</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-stone-400">
                    {s.note}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* security split                                                      */
/* ------------------------------------------------------------------ */

const SEC_LEFT = [
  { icon: KeyRound, title: "Hashed client-key secrets", body: "The 128-bit secret is shown exactly once — only a SHA-256 digest and last-4 are ever stored." },
  { icon: Users, title: "Multi-user, role-based", body: "superuser, admin and user roles. A friend can pool a key without anyone — not even an admin — seeing its value." },
  { icon: Lock, title: "Sessions that lock down", body: "PBKDF2-HMAC-SHA256 at 600k iterations, HttpOnly SameSite=Strict cookies, instant logout on credential changes." },
];

const SEC_RIGHT = [
  { icon: ShieldCheck, title: "Fail-closed by design", body: "Before setup, /v1 answers 503 and browsers go to the wizard. Keyed mode with zero client keys rejects everything." },
  { icon: MonitorDot, title: "Hardened responses", body: "Strict Content-Security-Policy, anti-framing and anti-sniffing headers, failed-login throttle on every response." },
  { icon: Ban, title: "Flood protection", body: "An in-flight cap sheds request floods with a clean 503 instead of falling over — and the loopback publish default prevents accidental exposure." },
];

function SecCol({ items }: { items: typeof SEC_LEFT }) {
  return (
    <div className="flex flex-col divide-y divide-stone-900/[0.06]">
      {items.map((it) => (
        <div key={it.title} className="group flex gap-4 py-5 first:pt-0 last:pb-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-900/[0.08] bg-white transition-colors group-hover:border-emerald-600/30 group-hover:bg-emerald-50">
            <it.icon className="h-4 w-4 text-stone-500 transition-colors group-hover:text-emerald-600" strokeWidth={1.7} />
          </div>
          <div>
            <h3 className="text-[14.5px] font-semibold tracking-tight text-stone-900">
              {it.title}
            </h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-stone-500">
              {it.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Security() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.4fr] lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="your keys stay yours"
              title={
                <>
                  Designed to fail
                  <br />
                  closed — not open.
                </>
              }
              sub="Credentials live in a 0600 config store on your own volume, never in environment variables. Fuzzed parsers, SHA-pinned CI and a weekly OpenSSF Scorecard keep the supply chain honest."
            />
            <Reveal delay={0.2}>
              <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-stone-900/[0.08] bg-white px-5 py-4">
                <Fingerprint className="h-5 w-5 text-emerald-600" strokeWidth={1.6} />
                <p className="text-[13.5px] font-medium text-stone-700">
                  Report vulnerabilities privately — never in a public issue.
                </p>
              </div>
            </Reveal>
          </div>
          <div className="grid gap-x-12 md:grid-cols-2">
            <Reveal>
              <SecCol items={SEC_LEFT} />
            </Reveal>
            <Reveal delay={0.1}>
              <SecCol items={SEC_RIGHT} />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
