import { Fragment, type ReactNode } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { CodeBlock } from "./docs-ui";
import type { Block, ParsedDoc } from "@/lib/docs-parser";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* inline markdown: **bold** · `code` · [link](url) · bare urls        */
/* ------------------------------------------------------------------ */

const TOKEN =
  /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\)|https?:\/\/[^\s)]+)/g;

function renderInline(text: string, keyBase: string): ReactNode[] {
  return text
    .split(TOKEN)
    .filter((p) => p !== "" && p !== undefined)
    .map((part, i) => {
      const key = `${keyBase}-${i}`;

      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={key} className="font-semibold text-stone-900">
            {renderInline(part.slice(2, -2), key)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={key}
            className="rounded-md border border-stone-900/[0.07] bg-stone-100 px-1.5 py-0.5 font-mono text-[0.82em] font-medium text-stone-700"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      const mdLink = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (mdLink) {
        return (
          <a
            key={key}
            href={mdLink[2]}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-emerald-700 underline decoration-emerald-600/30 underline-offset-2 transition-colors hover:decoration-emerald-600"
          >
            {mdLink[1]}
          </a>
        );
      }
      if (/^https?:\/\//.test(part)) {
        return (
          <a
            key={key}
            href={part}
            target="_blank"
            rel="noreferrer"
            className="break-all font-medium text-emerald-700 underline decoration-emerald-600/30 underline-offset-2 transition-colors hover:decoration-emerald-600"
          >
            {part.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </a>
        );
      }
      return <Fragment key={key}>{part}</Fragment>;
    });
}

/* ------------------------------------------------------------------ */
/* callout (blockquote) — emerald note / amber warning                 */
/* ------------------------------------------------------------------ */

function Callout({ text }: { text: string }) {
  const m = text.match(/^\*\*([^*]+)\*\*:?\s*(.*)$/s);
  const lead = (m?.[1] ?? "").toLowerCase();
  const warn = /important|caveat|limitation|key distinction|warning|note to/.test(
    lead
  );
  const Icon = warn ? AlertTriangle : Info;
  const rest = m ? m[2] : text;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border p-4",
        warn
          ? "border-amber-500/25 bg-amber-50/70"
          : "border-emerald-600/20 bg-emerald-50/70"
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border",
          warn
            ? "border-amber-500/25 bg-white text-amber-600"
            : "border-emerald-600/20 bg-white text-emerald-600"
        )}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <p className="text-[13.5px] leading-relaxed text-stone-600">
        {m ? (
          <>
            <strong
              className={cn(
                "mr-1 font-semibold",
                warn ? "text-amber-800" : "text-emerald-800"
              )}
            >
              {m[1]}:
            </strong>
            {renderInline(rest, "callout")}
          </>
        ) : (
          renderInline(text, "callout")
        )}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* tables                                                              */
/* ------------------------------------------------------------------ */

function DocTable({
  header,
  rows,
}: {
  header: string[];
  rows: string[][];
}) {
  return (
    <div className="nice-scroll overflow-x-auto rounded-2xl border border-stone-900/[0.08] bg-white shadow-[0_18px_40px_-28px_oklch(0.216_0.008_90/0.25)]">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="border-b border-stone-900/[0.07] bg-stone-50/80">
            {header.map((h, i) => (
              <th
                key={i}
                className="px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500"
              >
                {renderInline(h, `th-${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr
              key={r}
              className="border-b border-stone-900/[0.05] transition-colors last:border-0 hover:bg-emerald-50/40"
            >
              {row.map((cell, c) => (
                <td
                  key={c}
                  className="px-4 py-2.5 align-top text-[13px] leading-relaxed text-stone-600"
                >
                  {renderInline(cell, `td-${r}-${c}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* lists                                                               */
/* ------------------------------------------------------------------ */

function DocList({
  ordered,
  items,
}: {
  ordered: boolean;
  items: { text: string; children: string[] }[];
}) {
  if (ordered)
    return (
      <ol className="flex flex-col gap-2.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-emerald-600/20 bg-emerald-50 font-mono text-[10px] font-semibold text-emerald-700">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-[14px] leading-relaxed text-stone-600">
                {renderInline(it.text, `oli-${i}`)}
              </p>
              {it.children.length > 0 && (
                <ul className="mt-1.5 flex flex-col gap-1 pl-1">
                  {it.children.map((c, j) => (
                    <li key={j} className="flex gap-2">
                      <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-emerald-500/70" />
                      <p className="text-[13px] leading-relaxed text-stone-500">
                        {renderInline(c, `oli-${i}-${j}`)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    );

  return (
    <ul className="flex flex-col gap-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/80" />
          <div className="min-w-0">
            <p className="text-[14px] leading-relaxed text-stone-600">
              {renderInline(it.text, `li-${i}`)}
            </p>
            {it.children.length > 0 && (
              <ul className="mt-1.5 flex flex-col gap-1 pl-1">
                {it.children.map((c, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-stone-300" />
                    <p className="text-[13px] leading-relaxed text-stone-500">
                      {renderInline(c, `li-${i}-${j}`)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* blocks + sections                                                   */
/* ------------------------------------------------------------------ */

function BlockView({ block, idx }: { block: Block; idx: number }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="text-[14.5px] leading-relaxed text-stone-600">
          {renderInline(block.text, `p-${idx}`)}
        </p>
      );
    case "code":
      return <CodeBlock lang={block.lang} code={block.code} />;
    case "quote":
      return <Callout text={block.text} />;
    case "table":
      return <DocTable header={block.header} rows={block.rows} />;
    case "list":
      return <DocList ordered={block.ordered} items={block.items} />;
    case "heading":
      return (
        <h3
          id={block.id}
          className="group flex scroll-mt-28 items-center gap-2 pt-3 text-[1.12rem] font-semibold tracking-tight text-stone-900"
        >
          <a
            href={`#${block.id}`}
            aria-label={`Link to ${block.text}`}
            className="font-mono text-base text-emerald-600/0 transition-colors group-hover:text-emerald-600/70"
          >
            #
          </a>
          {block.text}
        </h3>
      );
    default:
      return null;
  }
}

export function DocsContent({ doc }: { doc: ParsedDoc }) {
  return (
    <div className="flex flex-col">
      {doc.sections.map((s, si) => (
        <section
          key={s.id}
          id={s.id}
          className="scroll-mt-28 border-stone-900/[0.07] pb-12 pt-2 [&:not(:first-child)]:border-t [&:not(:first-child)]:pt-12"
        >
          <header className="mb-6 flex items-center gap-3.5">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
              {String(si + 1).padStart(2, "0")}
            </span>
            <h2 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-stone-900">
              {s.title}
            </h2>
          </header>
          <div className="flex flex-col gap-4">
            {s.blocks.map((b, bi) => (
              <BlockView key={bi} block={b} idx={bi} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
