import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// tools/src/lib/paths.ts -> repo root is four levels up.
const here = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(here, "..", "..", "..");

export const AGENTS_DIR = resolve(REPO_ROOT, "agents");
export const SKILLS_DIR = resolve(REPO_ROOT, "skills");
export const SCHEMAS_DIR = resolve(REPO_ROOT, "schemas");
export const TEMPLATES_DIR = resolve(REPO_ROOT, "templates");
export const CATALOG_DIR = resolve(REPO_ROOT, "catalog");
export const TAXONOMY_FILE = resolve(REPO_ROOT, "taxonomy.json");
export const AGENT_SCHEMA_FILE = resolve(SCHEMAS_DIR, "agent.schema.json");
export const SKILL_SCHEMA_FILE = resolve(SCHEMAS_DIR, "skill.schema.json");
