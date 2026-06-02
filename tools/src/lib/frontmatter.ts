import { parseYaml } from "./yaml.ts";
import type { YamlValue } from "./yaml.ts";

export interface ParsedDoc {
  data: { [key: string]: YamlValue };
  body: string;
  /** True if a frontmatter block was found. */
  hasFrontmatter: boolean;
}

const FENCE = /^---\s*$/;

/**
 * Split a markdown document into its leading `--- ... ---` YAML frontmatter and
 * the remaining body. Tolerant of a leading BOM and CRLF line endings.
 */
export function parseFrontmatter(raw: string): ParsedDoc {
  const text = raw.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const lines = text.split("\n");

  if (lines[0] === undefined || !FENCE.test(lines[0])) {
    return { data: {}, body: text, hasFrontmatter: false };
  }

  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (FENCE.test(lines[i]!)) {
      end = i;
      break;
    }
  }
  if (end === -1) {
    return { data: {}, body: text, hasFrontmatter: false };
  }

  const yamlSrc = lines.slice(1, end).join("\n");
  const body = lines.slice(end + 1).join("\n").replace(/^\n+/, "");
  const parsed = parseYaml(yamlSrc);
  const data = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as { [k: string]: YamlValue }) : {};
  return { data, body, hasFrontmatter: true };
}
