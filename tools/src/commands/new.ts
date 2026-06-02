import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { AGENTS_DIR, SKILLS_DIR } from "../lib/paths.ts";
import { loadTaxonomy } from "../lib/registry.ts";
import { c, error, info, ok } from "../lib/log.ts";

interface Flags {
  [key: string]: string | boolean;
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    // Greedily collect all following tokens up to the next --flag as the value.
    // This makes multi-word values robust even when the shell/npm splits a quoted
    // value (e.g. `--description "two words"`) into separate argv tokens.
    const parts: string[] = [];
    while (i + 1 < argv.length && !argv[i + 1]!.startsWith("--")) {
      parts.push(argv[i + 1]!);
      i++;
    }
    flags[key] = parts.length === 0 ? true : parts.join(" ");
  }
  return flags;
}

function str(flags: Flags, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = flags[k];
    if (typeof v === "string") return v;
  }
  return undefined;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function csvList(v: string | undefined): string[] {
  if (!v) return [];
  return v
    .split(",")
    .map((s) => slugify(s))
    .filter((s) => s !== "");
}

function yamlList(items: string[]): string {
  return `[${items.join(", ")}]`;
}

function assertCategory(category: string): void {
  const taxonomy = loadTaxonomy();
  const valid = taxonomy.categories.map((cat) => cat.id);
  if (!valid.includes(category)) {
    error(`Unknown category '${category}'. Valid categories:\n  ${valid.join(", ")}`);
    process.exit(1);
  }
}

function buildAgent(opts: {
  name: string;
  description: string;
  category: string;
  model: string;
  tools: string[];
  tags: string[];
  skills: string[];
  maintainer: string;
}): string {
  const fm: string[] = ["---", `name: ${opts.name}`, `description: ${opts.description}`, `model: ${opts.model}`];
  if (opts.tools.length) fm.push(`tools: ${opts.tools.join(", ")}`);
  fm.push(`category: ${opts.category}`);
  if (opts.tags.length) fm.push(`tags: ${yamlList(opts.tags)}`);
  fm.push("version: 0.1.0");
  if (opts.maintainer) fm.push(`maintainer: ${opts.maintainer}`);
  if (opts.skills.length) fm.push(`skills: ${yamlList(opts.skills)}`);
  fm.push("status: experimental");
  fm.push("---");

  const title = titleCase(opts.name);
  const body = `
You are **${title}**, a specialist subagent. ${opts.description}

## When you are invoked
- Read the task and any referenced files before acting.
- Confirm scope: state in one line what you will and will not do.

## Operating procedure
1. **Gather context.** Inspect the relevant files/inputs. Do not assume; verify.
2. **Plan.** Outline the steps you will take.
3. **Execute.** Make focused, minimal changes. Match the surrounding conventions.
4. **Verify.** Check your work against the goal and report what you confirmed.

## Output contract
- Lead with the result or recommendation.
- Reference files as \`path:line\` so they are clickable.
- Be explicit about anything you could not verify.

## Guardrails
- Stay within the scope above; surface (don't silently expand) adjacent issues.
- Prefer reversible actions; confirm before anything destructive or outward-facing.
${opts.skills.length ? `\n## Backing skills\nThis agent relies on: ${opts.skills.map((s) => `\`${s}\``).join(", ")}.` : ""}
`;
  return `${fm.join("\n")}\n${body}`;
}

function buildSkill(opts: { name: string; description: string; category: string; tags: string[]; maintainer: string; allowedTools: string[] }): string {
  const fm: string[] = ["---", `name: ${opts.name}`, `description: ${opts.description}`];
  if (opts.allowedTools.length) fm.push(`allowed-tools: ${opts.allowedTools.join(", ")}`);
  fm.push(`category: ${opts.category}`);
  if (opts.tags.length) fm.push(`tags: ${yamlList(opts.tags)}`);
  fm.push("version: 0.1.0");
  if (opts.maintainer) fm.push(`maintainer: ${opts.maintainer}`);
  fm.push("license: MIT");
  fm.push("status: experimental");
  fm.push("---");

  const title = titleCase(opts.name);
  const body = `
# ${title}

${opts.description}

## When to use this skill
Describe the precise triggers. The \`description\` field above is what Claude
reads to decide whether to load this skill — keep it specific.

## Instructions
1. Step one.
2. Step two.
3. Step three.

## Inputs
- What this skill expects to be available (files, arguments, prior context).

## Output
- The exact shape of what the skill should produce.

## Notes
- Bundle any helper scripts under \`scripts/\` and reference data under \`references/\`
  inside this skill directory.
`;
  return `${fm.join("\n")}\n${body}`;
}

export function runNew(argv: string[]): number {
  const kind = argv[0];
  const flags = parseFlags(argv.slice(1));

  if (kind !== "agent" && kind !== "skill") {
    error("Usage: cmx new <agent|skill> --name <name> --category <id> [--description <text>] [...]");
    return 1;
  }

  const rawName = str(flags, "name", "n");
  const category = str(flags, "category", "c");
  const description = str(flags, "description", "desc", "d") ?? "TODO: describe when to use this and what it does (min 20 chars).";

  if (!rawName || !category) {
    error("Both --name and --category are required.");
    info("Example: cmx new agent --name sql-optimizer --category data --description \"Use when a SQL query is slow; rewrites it and explains the plan.\"");
    return 1;
  }

  const name = slugify(rawName);
  assertCategory(category);

  const tags = csvList(str(flags, "tags"));
  const skills = csvList(str(flags, "skills"));
  const maintainer = str(flags, "maintainer") ?? "";
  const force = flags.force === true;

  if (kind === "agent") {
    const model = str(flags, "model") ?? "sonnet";
    const tools = csvListRaw(str(flags, "tools"));
    const dir = join(AGENTS_DIR, category);
    const file = join(dir, `${name}.md`);
    if (existsSync(file) && !force) {
      error(`${file} already exists. Use --force to overwrite.`);
      return 1;
    }
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, buildAgent({ name, description, category, model, tools, tags, skills, maintainer }), "utf8");
    ok(`Created agent ${c.bold(name)} at agents/${category}/${name}.md`);
    info(`Next: edit the system prompt, then run ${c.cyan("npm run validate")} and ${c.cyan("npm run catalog")}.`);
    return 0;
  }

  // skill
  const dir = join(SKILLS_DIR, category, name);
  const file = join(dir, "SKILL.md");
  if (existsSync(file) && !force) {
    error(`${file} already exists. Use --force to overwrite.`);
    return 1;
  }
  const allowedTools = csvListRaw(str(flags, "allowed-tools", "tools"));
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, buildSkill({ name, description, category, tags, maintainer, allowedTools }), "utf8");
  ok(`Created skill ${c.bold(name)} at skills/${category}/${name}/SKILL.md`);
  info(`Next: fill in the instructions, then run ${c.cyan("npm run validate")} and ${c.cyan("npm run catalog")}.`);
  return 0;
}

// Tools keep their original casing (they are tool names like Read, Grep).
function csvListRaw(v: string | undefined): string[] {
  if (!v) return [];
  return v
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");
}
