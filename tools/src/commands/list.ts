import { loadAgents, loadSkills } from "../lib/registry.ts";
import { c, info } from "../lib/log.ts";

export function runList(argv: string[]): number {
  let category: string | undefined;
  let kind: "agent" | "skill" | undefined;
  let query: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--category" || a === "-c") category = argv[++i];
    else if (a === "--kind" || a === "-k") {
      const v = argv[++i];
      if (v === "agent" || v === "skill") kind = v;
    } else if (a === "--query" || a === "-q") query = argv[++i];
  }

  const matches = (name: string, desc: string, tags: string[], cat: string): boolean => {
    if (category && cat !== category) return false;
    if (query) {
      const q = query.toLowerCase();
      return name.toLowerCase().includes(q) || desc.toLowerCase().includes(q) || tags.some((t) => t.includes(q));
    }
    return true;
  };

  if (kind !== "skill") {
    const agents = loadAgents().filter((a) => matches(a.name, a.description, a.tags, a.category)).sort((x, y) => x.name.localeCompare(y.name));
    info(c.bold(`Agents (${agents.length})`));
    for (const a of agents) info(`  ${c.cyan(a.name.padEnd(28))} ${c.gray(a.category.padEnd(12))} ${truncate(a.description, 72)}`);
    info("");
  }

  if (kind !== "agent") {
    const skills = loadSkills().filter((s) => matches(s.name, s.description, s.tags, s.category)).sort((x, y) => x.name.localeCompare(y.name));
    info(c.bold(`Skills (${skills.length})`));
    for (const s of skills) info(`  ${c.magenta(s.name.padEnd(28))} ${c.gray(s.category.padEnd(12))} ${truncate(s.description, 72)}`);
  }
  return 0;
}

function truncate(s: string, n: number): string {
  const oneLine = s.replace(/\s+/g, " ").trim();
  return oneLine.length > n ? `${oneLine.slice(0, n - 1)}…` : oneLine;
}
