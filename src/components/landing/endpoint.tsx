"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, Globe } from "lucide-react";
import { SectionHeading, Reveal } from "./reveal";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */

const SNIPPETS: Record<string, { lang: string; code: string }> = {
  curl: {
    lang: "shell",
    code: `curl http://localhost:8000/v1/chat/completions \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer npk_your-key-here' \\
  -d '{
    "model": "deepseek-ai/deepseek-r1",
    "stream": true,
    "messages": [{"role":"user","content":"hello"}]
  }'`,
  },
  opencode: {
    lang: "opencode.json",
    code: `{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "nim": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "OpenProxy (proxied)",
      "options": {
        "baseURL": "http://localhost:8000/v1",
        "apiKey": "npk_your-key-here",
        "timeout": false
      }
    }
  }
}`,
  },
  codex: {
    lang: "config.toml",
    code: `model_provider = "nim"
model = "moonshotai/kimi-k2-instruct"

[model_providers.nim]
name = "OpenProxy (proxied)"
base_url = "http://localhost:8000/v1"
env_key = "OPENPROXY_API_KEY"
wire_api = "chat"`,
  },
  n8n: {
    lang: "credential",
    code: `# n8n → Credentials → OpenAI
Base URL:  http://localhost:8000/v1
API Key:   npk_your-key-here

# then pick any model from the
# merged /v1/models catalog`,
  },
};

const CLIENTS = [
  { name: "OpenCode", note: "agentic coding" },
  { name: "Codex CLI", note: "terminal agent" },
  { name: "n8n", note: "workflow automation" },
  { name: "Cline", note: "VS Code agent" },
  { name: "Hermes", note: "autonomous agent" },
  { name: "Claude Code", note: "terminal agent" },
  { name: "curl", note: "scripts & tests" },
  { name: "Your app", note: "anything OpenAI" },
];

function CodeBlock() {
  const [tab, setTab] = useState<keyof typeof SNIPPETS>("curl");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SNIPPETS[tab].code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-900/10 bg-[#0c0a09] shadow-[0_32px_64px_-28px_oklch(0.216_0.008_90/0.4)]">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-3 py-2">
        <div className="flex gap-1">
          {(Object.keys(SNIPPETS) as (keyof typeof SNIPPETS)[]).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cn(
                "rounded-lg px-3 py-1.5 font-mono text-[11px] transition-colors",
                tab === k
                  ? "bg-white/10 text-emerald-300"
                  : "text-white/40 hover:text-white/70"
              )}
            >
              {k}
            </button>
          ))}
        </div>
        <button
          onClick={copy}
          aria-label="Copy code"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2} />
          ) : (
            <Copy className="h-3.5 w-3.5" strokeWidth={1.8} />
          )}
        </button>
      </div>
      <div className="relative min-h-[276px]">
        <AnimatePresence mode="wait">
          <motion.pre
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="nice-scroll overflow-x-auto p-5 font-mono text-[12px] leading-relaxed text-stone-300"
          >
            <code>{SNIPPETS[tab].code}</code>
          </motion.pre>
        </AnimatePresence>
        <span className="absolute bottom-3 right-4 font-mono text-[9px] uppercase tracking-[0.2em] text-white/20">
          {SNIPPETS[tab].lang}
        </span>
      </div>
    </div>
  );
}

export function Endpoint() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="developer experience"
              title={
                <>
                  One endpoint.
                  <br />
                  Any OpenAI-compatible client.
                </>
              }
              sub="Point anything at /v1 with an npk_ client key and you are done. Model IDs pass through verbatim, streaming works, and the merged model catalog answers from cache."
            />
            <Reveal delay={0.2}>
              <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-2">
                {CLIENTS.map((c, i) => (
                  <motion.div
                    key={c.name}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.5 }}
                    className="group flex items-center gap-2.5 rounded-xl border border-stone-900/[0.07] bg-white px-3.5 py-2.5 transition-all hover:-translate-y-0.5 hover:border-emerald-600/30"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 transition-colors group-hover:bg-emerald-100">
                      <Check className="h-3 w-3 text-emerald-600" strokeWidth={2.4} />
                    </span>
                    <div className="min-w-0 leading-tight">
                      <p className="truncate text-[13px] font-semibold text-stone-800">
                        {c.name}
                      </p>
                      <p className="truncate font-mono text-[9.5px] uppercase tracking-wider text-stone-400">
                        {c.note}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.25}>
              <p className="mt-7 flex items-start gap-2.5 text-[14.5px] leading-relaxed text-stone-500">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={1.8} />
                If your client speaks OpenAI, it already knows how to speak to
                open-proxy.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.12}>
            <div className="flex flex-col gap-3">
              <div className="diffuse-card flex items-center gap-3 rounded-2xl px-5 py-4 font-mono text-[12px]">
                <span className="rounded-md bg-stone-100 px-2 py-1 text-[9.5px] font-semibold uppercase tracking-wider text-stone-500">
                  env
                </span>
                <span className="text-stone-500">
                  BASE_URL=<span className="text-emerald-700">http://localhost:8000/v1</span>
                </span>
              </div>
              <CodeBlock />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
