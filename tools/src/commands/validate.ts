import { readFileSync } from "node:fs";
import { basename, dirname } from "node:path";
import { validate as schemaValidate } from "../lib/jsonschema.ts";
import type { Schema } from "../lib/jsonschema.ts";
import { loadAgents, loadSkills, loadTaxonomy } from "../lib/registry.ts";
import { parseFrontmatter } from "../lib/frontmatter.ts";
import { AGENT_SCHEMA_FILE, SKILL_SCHEMA_FILE } from "../lib/paths.ts";
import { c, error, info, ok, warn } from "../lib/log.ts";
import type { AgentRecord, SkillRecord } from "../types.ts";

interface Finding {
  level: "error" | "warning";
  where: string;
  message: string;
}

function loadSchema(file: string): Schema {
  return JSON.parse(readFileSync(file, "utf8")) as Schema;
}

const MIN_BODY_CHARS = 80;

export function runValidate(): number {
  const findings: Finding[] = [];
  const taxonomy = loadTaxonomy();
  const validCategories = new Set(taxonomy.categories.map((cat) => cat.id));
  const agentSchema = loadSchema(AGENT_SCHEMA_FILE);
  const skillSchema = loadSchema(SKILL_SCHEMA_FILE);

  const agents = loadAgents();
  const skills = loadSkills();
  const skillNames = new Set(skills.map((s) => s.name));
  const skillStatusByName = new Map(skills.map((s) => [s.name, s.status]));

  // --- Agents ---
  const seenAgentNames = new Map<string, string>();
  for (const a of agents) {
    const where = a.relPath;
    const fm = parseFrontmatter(readFileSync(a.file, "utf8"));
    if (!fm.hasFrontmatter) {
      findings.push({ level: "error", where, message: "missing YAML frontmatter block" });
      continue;
    }
    for (const issue of schemaValidate(fm.data, agentSchema)) {
      findings.push({ level: "error", where, message: `frontmatter.${issue.path}: ${issue.message}` });
    }
    checkNameMatchesFile(a, findings);
    checkCategory(a.category, validCategories, where, findings);
    checkFolderCategory(a.folderCategory, a.category, where, findings);
    checkBody(a, findings);
    for (const dep of a.skills) {
      if (!skillNames.has(dep)) {
        findings.push({ level: "error", where, message: `declares backing skill '${dep}' which does not exist in skills/` });
      } else if (a.status === "stable" && skillStatusByName.get(dep) !== "stable") {
        findings.push({ level: "error", where, message: `stable agent lists non-stable skill '${dep}' (${skillStatusByName.get(dep)}) — maturity must match (promote the skill or the agent must not be stable)` });
      }
    }
    if (a.skills.length === 0) {
      findings.push({ level: "warning", where, message: "composes no backing skills — thin agents should compose at least one capability/shared skill (is this a deliberate self-contained exception?)" });
    }
    const prior = seenAgentNames.get(a.name);
    if (prior) findings.push({ level: "error", where, message: `duplicate agent name '${a.name}' (also in ${prior})` });
    else seenAgentNames.set(a.name, where);
  }

  // --- Skills ---
  const seenSkillNames = new Map<string, string>();
  for (const s of skills) {
    const where = s.relPath;
    const fm = parseFrontmatter(readFileSync(s.file, "utf8"));
    if (!fm.hasFrontmatter) {
      findings.push({ level: "error", where, message: "missing YAML frontmatter block" });
      continue;
    }
    for (const issue of schemaValidate(fm.data, skillSchema)) {
      findings.push({ level: "error", where, message: `frontmatter.${issue.path}: ${issue.message}` });
    }
    const dir = basename(dirname(s.file));
    if (s.name && dir !== s.name) {
      findings.push({ level: "error", where, message: `skill name '${s.name}' must match its directory name '${dir}'` });
    }
    checkCategory(s.category, validCategories, where, findings);
    checkFolderCategory(s.folderCategory, s.category, where, findings);
    checkBody(s, findings);
    const prior = seenSkillNames.get(s.name);
    if (prior) findings.push({ level: "error", where, message: `duplicate skill name '${s.name}' (also in ${prior})` });
    else seenSkillNames.set(s.name, where);
  }

  // --- Report ---
  const errors = findings.filter((f) => f.level === "error");
  const warnings = findings.filter((f) => f.level === "warning");

  for (const f of findings) {
    const line = `${c.gray(f.where)}: ${f.message}`;
    if (f.level === "error") error(line);
    else warn(line);
  }

  info("");
  info(`Scanned ${c.bold(String(agents.length))} agents and ${c.bold(String(skills.length))} skills.`);
  if (errors.length === 0) {
    ok(`Validation passed${warnings.length ? ` with ${warnings.length} warning(s)` : ""}.`);
    return 0;
  }
  error(`Validation failed: ${errors.length} error(s), ${warnings.length} warning(s).`);
  return 1;
}

function checkNameMatchesFile(a: AgentRecord, findings: Finding[]): void {
  const expected = `${a.name}.md`;
  const actual = basename(a.file);
  if (a.name && actual !== expected) {
    findings.push({ level: "error", where: a.relPath, message: `agent name '${a.name}' must match filename (expected ${expected}, got ${actual})` });
  }
}

function checkCategory(category: string, valid: Set<string>, where: string, findings: Finding[]): void {
  if (category && !valid.has(category)) {
    findings.push({ level: "error", where, message: `category '${category}' is not in taxonomy.json` });
  }
}

function checkFolderCategory(folderCategory: string, category: string, where: string, findings: Finding[]): void {
  if (folderCategory && category && folderCategory !== category) {
    findings.push({ level: "warning", where, message: `lives under folder '${folderCategory}' but declares category '${category}' — keep them aligned` });
  }
}

// Tool-call / harness markup that occasionally leaks into a generated body and
// must never ship: a standalone closing/opening tag line or an `antml:` token.
const ARTIFACT_LINE = /^[ \t]*<\/?(?:content|invoke|parameter|function_calls|antml)\b[^>]*>[ \t]*$/m;

function checkBody(rec: AgentRecord | SkillRecord, findings: Finding[]): void {
  if (rec.body.trim().length < MIN_BODY_CHARS) {
    findings.push({ level: "warning", where: rec.relPath, message: `body is very short (<${MIN_BODY_CHARS} chars) — add a proper system prompt / instructions` });
  }
  const artifact = rec.body.match(ARTIFACT_LINE) ?? rec.body.match(/antml:/);
  if (artifact) {
    findings.push({ level: "error", where: rec.relPath, message: `body contains a stray tool/markup artifact (${JSON.stringify(artifact[0].trim())}) — likely leaked during authoring; remove it` });
  }
}
