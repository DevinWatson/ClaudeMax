#!/usr/bin/env node
// Thin launcher so `cmx` works as an installed bin. It re-execs Node with the
// type-stripping flag so the TypeScript sources run without a build step.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const entry = resolve(here, "..", "src", "cli.ts");

const result = spawnSync(process.execPath, ["--experimental-strip-types", "--no-warnings", entry, ...process.argv.slice(2)], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
