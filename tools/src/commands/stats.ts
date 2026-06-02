import { loadAgents, loadSkills, loadTaxonomy } from "../lib/registry.ts";
import { c, info } from "../lib/log.ts";

export function runStats(): number {
  const taxonomy = loadTaxonomy();
  const agents = loadAgents();
  const skills = loadSkills();

  info(c.bold("ClaudeMax inventory"));
  info(`  agents: ${agents.length}`);
  info(`  skills: ${skills.length}`);
  info(`  categories: ${taxonomy.categories.length}`);
  info("");

  const rows: Array<[string, number, number]> = taxonomy.categories.map((cat) => [
    cat.id,
    agents.filter((a) => a.category === cat.id).length,
    skills.filter((s) => s.category === cat.id).length,
  ]);

  const pad = Math.max(8, ...rows.map((r) => r[0].length));
  info(`${"category".padEnd(pad)}  agents  skills`);
  info(`${"-".repeat(pad)}  ------  ------`);
  for (const [id, a, s] of rows) {
    const line = `${id.padEnd(pad)}  ${String(a).padStart(6)}  ${String(s).padStart(6)}`;
    info(a + s === 0 ? c.gray(line) : line);
  }

  const byStatus = (recs: Array<{ status: string }>) => {
    const m = new Map<string, number>();
    for (const r of recs) m.set(r.status, (m.get(r.status) ?? 0) + 1);
    return [...m.entries()].map(([k, v]) => `${k}=${v}`).join(", ") || "none";
  };
  info("");
  info(`agent status:  ${byStatus(agents)}`);
  info(`skill status:  ${byStatus(skills)}`);
  return 0;
}
