import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { parseFrontmatter } from "./frontmatter.ts";
import { AGENTS_DIR, SKILLS_DIR, TAXONOMY_FILE, REPO_ROOT } from "./paths.ts";
import type { AgentRecord, SkillRecord, Frontmatter, Taxonomy } from "../types.ts";
import type { YamlValue } from "./yaml.ts";

function walkFiles(dir: string, predicate: (file: string) => boolean): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walkFiles(full, predicate));
    } else if (predicate(full)) {
      out.push(full);
    }
  }
  return out;
}

function relPosix(file: string): string {
  return relative(REPO_ROOT, file).split(sep).join("/");
}

function asString(v: YamlValue | undefined, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asStringOrNull(v: YamlValue | undefined): string | null {
  return typeof v === "string" ? v : null;
}

/** Accept either a YAML array of strings or a comma-separated string. */
function asStringArray(v: YamlValue | undefined): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  if (typeof v === "string") {
    return v
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");
  }
  return [];
}

function firstSegment(dir: string, file: string): string {
  const rel = relative(dir, file).split(sep);
  return rel.length > 1 ? rel[0]! : "";
}

export function loadTaxonomy(): Taxonomy {
  return JSON.parse(readFileSync(TAXONOMY_FILE, "utf8")) as Taxonomy;
}

export function loadAgents(): AgentRecord[] {
  const files = walkFiles(AGENTS_DIR, (f) => f.endsWith(".md") && !f.endsWith("README.md"));
  return files.map((file) => {
    const { data, body } = parseFrontmatter(readFileSync(file, "utf8"));
    return {
      kind: "agent",
      file,
      relPath: relPosix(file),
      folderCategory: firstSegment(AGENTS_DIR, file),
      name: asString(data.name),
      description: asString(data.description),
      category: asString(data.category),
      model: asStringOrNull(data.model),
      tools: asStringArray(data.tools),
      tags: asStringArray(data.tags),
      version: asString(data.version),
      maintainer: asStringOrNull(data.maintainer),
      skills: asStringArray(data.skills),
      status: asString(data.status, "stable"),
      data: data as Frontmatter,
      body,
    } satisfies AgentRecord;
  });
}

export function loadSkills(): SkillRecord[] {
  const files = walkFiles(SKILLS_DIR, (f) => f.endsWith("SKILL.md"));
  return files.map((file) => {
    const { data, body } = parseFrontmatter(readFileSync(file, "utf8"));
    return {
      kind: "skill",
      file,
      relPath: relPosix(file),
      folderCategory: firstSegment(SKILLS_DIR, file),
      name: asString(data.name),
      description: asString(data.description),
      category: asString(data.category),
      tags: asStringArray(data.tags),
      version: asString(data.version),
      maintainer: asStringOrNull(data.maintainer),
      status: asString(data.status, "stable"),
      data: data as Frontmatter,
      body,
    } satisfies SkillRecord;
  });
}
