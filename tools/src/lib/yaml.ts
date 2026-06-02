/**
 * Minimal, dependency-free YAML parser for frontmatter.
 *
 * Supports the documented subset used by ClaudeMax frontmatter:
 *   - scalars: strings (quoted or bare), numbers, booleans, null
 *   - block mappings (key: value, with nested indented blocks)
 *   - block sequences of scalars (- item) and of mappings (- key: value)
 *   - inline flow arrays ([a, b, c]) and flow maps ({a: b})
 *   - "# ..." line and trailing comments on bare scalars
 *
 * It is intentionally NOT a full YAML implementation. If you need anchors,
 * multi-line block scalars, or merge keys, keep them out of frontmatter.
 */

export type YamlValue = string | number | boolean | null | YamlValue[] | { [key: string]: YamlValue };

interface SrcLine {
  indent: number;
  content: string;
  lineNo: number;
}

export class YamlError extends Error {
  lineNo: number;
  constructor(message: string, lineNo: number) {
    super(`YAML parse error (line ${lineNo}): ${message}`);
    this.name = "YamlError";
    this.lineNo = lineNo;
  }
}

function toLines(src: string): SrcLine[] {
  const out: SrcLine[] = [];
  const rawLines = src.replace(/\r\n/g, "\n").split("\n");
  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i] ?? "";
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const indent = raw.length - raw.trimStart().length;
    out.push({ indent, content: trimmed, lineNo: i + 1 });
  }
  return out;
}

/** Split a flow collection body on top-level commas (respecting quotes/brackets). */
function splitFlow(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let cur = "";
  for (const ch of body) {
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
      continue;
    }
    if (ch === "[" || ch === "{") depth++;
    if (ch === "]" || ch === "}") depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim() !== "" || parts.length > 0) parts.push(cur);
  return parts.map((p) => p.trim()).filter((p) => p !== "");
}

function stripTrailingComment(s: string): string {
  // Only strip a comment introduced by whitespace + '#' on a bare (unquoted) scalar.
  const m = s.match(/\s+#/);
  if (m && m.index !== undefined) return s.slice(0, m.index).trim();
  return s;
}

function parseScalar(rawIn: string, lineNo: number): YamlValue {
  const raw = rawIn.trim();
  if (raw === "") return null;

  // Quoted strings
  if ((raw.startsWith('"') && raw.endsWith('"') && raw.length >= 2) || (raw.startsWith("'") && raw.endsWith("'") && raw.length >= 2)) {
    const inner = raw.slice(1, -1);
    return raw[0] === '"' ? inner.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\") : inner.replace(/''/g, "'");
  }

  // Flow array
  if (raw.startsWith("[") && raw.endsWith("]")) {
    return splitFlow(raw.slice(1, -1)).map((p) => parseScalar(p, lineNo));
  }

  // Flow map
  if (raw.startsWith("{") && raw.endsWith("}")) {
    const obj: { [k: string]: YamlValue } = {};
    for (const entry of splitFlow(raw.slice(1, -1))) {
      const idx = entry.indexOf(":");
      if (idx === -1) throw new YamlError(`invalid flow map entry: ${entry}`, lineNo);
      obj[entry.slice(0, idx).trim()] = parseScalar(entry.slice(idx + 1), lineNo);
    }
    return obj;
  }

  const v = stripTrailingComment(raw);
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "null" || v === "~") return null;
  if (/^-?\d+$/.test(v)) return Number.parseInt(v, 10);
  if (/^-?\d*\.\d+$/.test(v)) return Number.parseFloat(v);
  return v;
}

function splitKey(content: string, lineNo: number): { key: string; rest: string } {
  // Find the first ": " or trailing ":" that is not inside quotes.
  let quote: string | null = null;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    if (ch === ":" && (i === content.length - 1 || content[i + 1] === " ")) {
      const rawKey = content.slice(0, i).trim();
      const key = rawKey.startsWith('"') || rawKey.startsWith("'") ? (parseScalar(rawKey, lineNo) as string) : rawKey;
      return { key, rest: content.slice(i + 1).trim() };
    }
  }
  throw new YamlError(`expected 'key: value' but got: ${content}`, lineNo);
}

function parseBlock(lines: SrcLine[], start: number): [YamlValue, number] {
  const first = lines[start];
  if (!first) return [null, start];
  const baseIndent = first.indent;

  if (first.content.startsWith("- ") || first.content === "-") {
    const arr: YamlValue[] = [];
    let i = start;
    while (i < lines.length && lines[i]!.indent === baseIndent && (lines[i]!.content.startsWith("- ") || lines[i]!.content === "-")) {
      const line = lines[i]!;
      const itemContent = line.content === "-" ? "" : line.content.slice(2).trim();
      if (itemContent === "") {
        // Nested block belongs to this item.
        i++;
        if (i < lines.length && lines[i]!.indent > baseIndent) {
          const [val, ni] = parseBlock(lines, i);
          arr.push(val);
          i = ni;
        } else {
          arr.push(null);
        }
      } else if (isKeyValue(itemContent)) {
        // "- key: value" mapping item; gather this and following deeper-indented keys.
        const synthetic: SrcLine[] = [{ indent: baseIndent + 2, content: itemContent, lineNo: line.lineNo }];
        i++;
        while (i < lines.length && lines[i]!.indent > baseIndent) {
          synthetic.push(lines[i]!);
          i++;
        }
        const [val] = parseBlock(synthetic, 0);
        arr.push(val);
      } else {
        arr.push(parseScalar(itemContent, line.lineNo));
        i++;
      }
    }
    return [arr, i];
  }

  // Mapping
  const obj: { [k: string]: YamlValue } = {};
  let i = start;
  while (i < lines.length && lines[i]!.indent === baseIndent && !lines[i]!.content.startsWith("- ")) {
    const line = lines[i]!;
    const { key, rest } = splitKey(line.content, line.lineNo);
    i++;
    if (rest === "") {
      if (i < lines.length && lines[i]!.indent > baseIndent) {
        const [val, ni] = parseBlock(lines, i);
        obj[key] = val;
        i = ni;
      } else {
        obj[key] = null;
      }
    } else {
      obj[key] = parseScalar(rest, line.lineNo);
    }
  }
  return [obj, i];
}

function isKeyValue(s: string): boolean {
  try {
    splitKey(s, 0);
    return true;
  } catch {
    return false;
  }
}

/** Parse a YAML document (the subset described above) into a JS value. */
export function parseYaml(src: string): YamlValue {
  const lines = toLines(src);
  if (lines.length === 0) return null;
  const [value] = parseBlock(lines, 0);
  return value;
}
