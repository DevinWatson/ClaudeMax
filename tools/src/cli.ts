import { runNew } from "./commands/new.ts";
import { runValidate } from "./commands/validate.ts";
import { runCatalog } from "./commands/catalog.ts";
import { runStats } from "./commands/stats.ts";
import { runList } from "./commands/list.ts";
import { runInstall } from "./commands/install.ts";
import { c, info } from "./lib/log.ts";

const HELP = `${c.bold("cmx")} — ClaudeMax agent & skill toolkit

${c.bold("Usage")}
  cmx <command> [options]

${c.bold("Commands")}
  new agent   --name <n> --category <id> [--description <t>] [--model <m>]
              [--tools "Read, Grep"] [--tags a,b] [--skills s1,s2] [--maintainer <e>] [--force]
  new skill   --name <n> --category <id> [--description <t>] [--tags a,b] [--maintainer <e>] [--force]
  validate                      Validate every agent & skill against schemas + conventions.
  catalog     [--check]         Generate catalog/CATALOG.md + index.json (--check fails if stale).
  stats                         Print inventory counts by category and status.
  list        [--kind agent|skill] [--category <id>] [--query <text>]
  install     --target <dir|user> [--category <id>] [--name <n>] [--query <t>]
              [--no-skills] [--include-experimental] [--dry-run]
  help                          Show this help.

${c.bold("Examples")}
  cmx new agent --name sql-optimizer --category data \\
      --description "Use when a SQL query is slow; rewrites it and explains the plan." \\
      --model sonnet --tools "Read, Bash" --skills sql-explain-analysis
  cmx validate
  cmx catalog
  cmx install --target . --category engineering
`;

function main(argv: string[]): number {
  const [command, ...rest] = argv;
  switch (command) {
    case "new":
      return runNew(rest);
    case "validate":
      return runValidate();
    case "catalog":
      return runCatalog(rest);
    case "stats":
      return runStats();
    case "list":
      return runList(rest);
    case "install":
      return runInstall(rest);
    case undefined:
    case "help":
    case "--help":
    case "-h":
      info(HELP);
      return 0;
    default:
      info(`Unknown command: ${command}\n`);
      info(HELP);
      return 1;
  }
}

process.exit(main(process.argv.slice(2)));
