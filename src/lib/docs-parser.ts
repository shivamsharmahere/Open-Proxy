/* Minimal markdown parser tuned for openproxy-docs.md.
   Produces a block AST + section model used by the /docs route. */

export type ListItem = { text: string; children: string[] };

export type Block =
  | { type: "heading"; level: 2 | 3; text: string; id: string }
  | { type: "paragraph"; text: string }
  | { type: "code"; lang: string; code: string }
  | { type: "quote"; text: string }
  | { type: "table"; header: string[]; rows: string[][] }
  | { type: "list"; ordered: boolean; items: ListItem[] };

export type DocSub = { id: string; title: string };

export type DocSection = {
  id: string;
  title: string;
  blocks: Block[];
  subs: DocSub[];
};

export type ParsedDoc = {
  title: string;
  tagline: string;
  sections: DocSection[];
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitRow(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inCode = false;
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === "`") inCode = !inCode;
    if (ch === "|" && !inCode) {
      cells.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur.trim());
  return cells;
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));
}

export function parseDocs(md: string): ParsedDoc {
  const lines = md.split("\n");
  const title = (lines.find((l) => l.startsWith("# ")) ?? "# Documentation")
    .replace(/^#\s+/, "")
    .trim();
  const tagline =
    (
      lines.find((l) => l.startsWith("> ") && !l.startsWith("> **")) ?? ""
    ).replace(/^>\s?/, "") || "";

  const sections: DocSection[] = [];
  let cur: DocSection | null = null;
  const usedIds = new Set<string>();

  const uniqueId = (raw: string): string => {
    let id = slugify(raw) || "section";
    let n = 2;
    while (usedIds.has(id)) id = `${slugify(raw)}-${n++}`;
    usedIds.add(id);
    return id;
  };

  let i = 0;
  /* skip the preamble (h1 title + tagline quote + hr) */
  while (i < lines.length && !lines[i].startsWith("## ")) i += 1;
  const push = (b: Block) => {
    if (!cur) {
      cur = { id: "intro", title: "Overview", blocks: [], subs: [] };
      sections.push(cur);
    }
    cur.blocks.push(b);
  };

  while (i < lines.length) {
    const line = lines[i];

    /* blank / hr */
    if (!line.trim() || /^---+$/.test(line.trim())) {
      i += 1;
      continue;
    }

    /* h1 doc title — already extracted, skip */
    if (line.startsWith("# ")) {
      i += 1;
      continue;
    }

    /* headings (h1 already consumed as doc title) */
    if (line.startsWith("## ") || line.startsWith("### ")) {
      const level = line.startsWith("### ") ? 3 : 2;
      const text = line.replace(/^#{2,4}\s+/, "").trim();
      if (level === 2) {
        cur = {
          id: uniqueId(text),
          title: text,
          blocks: [],
          subs: [],
        };
        sections.push(cur);
      } else {
        const id = uniqueId(text);
        if (cur) cur.subs.push({ id, title: text });
        push({ type: "heading", level: 3, text, id });
      }
      i += 1;
      continue;
    }

    /* fenced code */
    const fence = line.match(/^```(\w*)/);
    if (fence) {
      const lang = fence[1] || "text";
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) {
        body.push(lines[i]);
        i += 1;
      }
      i += 1; /* closing fence */
      push({ type: "code", lang, code: body.join("\n") });
      continue;
    }

    /* table */
    if (line.trim().startsWith("|")) {
      const header = splitRow(line.trim());
      i += 1;
      /* skip separator */
      if (i < lines.length && lines[i].trim().startsWith("|")) {
        const sep = splitRow(lines[i].trim());
        if (isSeparatorRow(sep)) i += 1;
      }
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitRow(lines[i].trim()));
        i += 1;
      }
      push({ type: "table", header, rows });
      continue;
    }

    /* blockquote / callout */
    if (line.startsWith(">")) {
      const parts: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        parts.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      push({ type: "quote", text: parts.join(" ").trim() });
      continue;
    }

    /* lists (top-level items; one nesting level of "- " children) */
    const ulMatch = line.match(/^- (.*)$/);
    const olMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (ulMatch || olMatch) {
      const ordered = Boolean(olMatch);
      const items: ListItem[] = [];
      while (i < lines.length) {
        const l = lines[i];
        const ul = l.match(/^- (.*)$/);
        const ol = l.match(/^(\d+)\.\s+(.*)$/);
        const child = l.match(/^\s+- (.*)$/);
        if (ordered && ol) {
          items.push({ text: ol[2].trim(), children: [] });
        } else if (!ordered && ul) {
          items.push({ text: ul[1].trim(), children: [] });
        } else if (child && items.length > 0) {
          items[items.length - 1].children.push(child[1].trim());
        } else {
          break;
        }
        i += 1;
      }
      push({ type: "list", ordered, items });
      continue;
    }

    /* paragraph (join consecutive plain lines) */
    const para: string[] = [];
    while (i < lines.length) {
      const l = lines[i];
      if (
        !l.trim() ||
        l.startsWith("#") ||
        l.startsWith(">") ||
        l.startsWith("```") ||
        l.trim().startsWith("|") ||
        /^---+$/.test(l.trim()) ||
        /^- /.test(l) ||
        /^\d+\.\s+/.test(l)
      )
        break;
      para.push(l.trim());
      i += 1;
    }
    if (para.length) push({ type: "paragraph", text: para.join(" ") });
  }

  return { title, tagline, sections };
}
