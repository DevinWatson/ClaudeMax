import { cpSync, copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { loadAgents, loadSkills } from "../lib/registry.ts";
import { c, error, info, ok, warn } from "../lib/log.ts";
import type { SkillRecord } from "../types.ts";

interface InstallFlags {
  target: string;
  category?: string;
  query?: string;
  name?: string;
  includeExperimental: boolean;
  withSkills: boolean;
  dryRun: boolean;
}

function parse(argv: string[]): InstallFlags {
  const flags: InstallFlags = {
    target: process.cwd(),
    includeExperimental: false,
    withSkills: true,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--target" || a === "-t") {
      const v = argv[++i] ?? "";
      flags.target = v === "user" ? homedir() : resolve(v);
    } else if (a === "--category" || a === "-c") flags.category = argv[++i];
    else if (a === "--query" || a === "-q") flags.query = argv[++i];
    else if (a === "--name" || a === "-n") flags.name = argv[++i];
    else if (a === "--include-experimental") flags.includeExperimental = true;
    else if (a === "--no-skills") flags.withSkills = false;
    else if (a === "--dry-run") flags.dryRun = true;
  }
  return flags;
}

export function runInstall(argv: string[]): number {
  const flags = parse(argv);
  const claudeDir = join(flags.target, ".claude");

  const allSkills = loadSkills();
  const skillByName = new Map<string, SkillRecord>(allSkills.map((s) => [s.name, s]));

  let agents = loadAgents();
  if (!flags.includeExperimental) agents = agents.filter((a) => a.status !== "experimental");
  if (flags.category) agents = agents.filter((a) => a.category === flags.category);
  if (flags.name) agents = agents.filter((a) => a.name === flags.name);
  if (flags.query) {
    const q = flags.query.toLowerCase();
    agents = agents.filter((a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.tags.some((t) => t.includes(q)));
  }

  if (agents.length === 0) {
    warn("No agents matched the given filters. Nothing to install.");
    return 0;
  }

  // Collect backing skills.
  const skillsToInstall = new Set<SkillRecord>();
  if (flags.withSkills) {
    for (const a of agents) {
      for (const dep of a.skills) {
        const skill = skillByName.get(dep);
        if (skill) skillsToInstall.add(skill);
        else warn(`agent '${a.name}' references missing skill '${dep}' — skipped`);
      }
    }
  }

  info(`Target: ${c.bold(claudeDir)}`);
  info(`Agents: ${agents.length}  ·  Backing skills: ${skillsToInstall.size}${flags.dryRun ? c.yellow("  (dry run)") : ""}`);
  info("");

  for (const a of agents) {
    const dest = join(claudeDir, "agents", `${a.name}.md`);
    info(`  agent  ${c.cyan(a.name)} -> ${rel(flags.target, dest)}`);
    if (!flags.dryRun) {
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(a.file, dest);
    }
  }
  for (const s of skillsToInstall) {
    const destDir = join(claudeDir, "skills", s.name);
    info(`  skill  ${c.magenta(s.name)} -> ${rel(flags.target, destDir)}`);
    if (!flags.dryRun) {
      mkdirSync(destDir, { recursive: true });
      cpSync(dirname(s.file), destDir, { recursive: true });
    }
  }

  info("");
  if (flags.dryRun) {
    ok("Dry run complete. Re-run without --dry-run to write files.");
  } else {
    ok(`Installed into ${claudeDir}. Restart Claude Code in that directory to pick them up.`);
  }
  if (!existsSync(claudeDir) && flags.dryRun) {
    info(c.gray("(target .claude/ does not exist yet; it will be created)"));
  }
  return 0;
}

function rel(base: string, p: string): string {
  return p.startsWith(base) ? `.${p.slice(base.length)}` : p;
}
