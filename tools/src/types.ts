import type { YamlValue } from "./lib/yaml.ts";

export type Frontmatter = { [key: string]: YamlValue };

export interface AgentRecord {
  kind: "agent";
  /** Absolute path to the .md file. */
  file: string;
  /** Path relative to repo root, posix-style. */
  relPath: string;
  /** Category folder the file lives in (first path segment under agents/). */
  folderCategory: string;
  name: string;
  description: string;
  category: string;
  model: string | null;
  tools: string[];
  tags: string[];
  version: string;
  maintainer: string | null;
  skills: string[];
  status: string;
  data: Frontmatter;
  body: string;
}

export interface SkillRecord {
  kind: "skill";
  /** Absolute path to the SKILL.md file. */
  file: string;
  relPath: string;
  folderCategory: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  version: string;
  maintainer: string | null;
  status: string;
  data: Frontmatter;
  body: string;
}

export interface TaxonomyCategory {
  id: string;
  title: string;
  summary: string;
  examples?: string[];
}

export interface Taxonomy {
  version: string;
  description?: string;
  categories: TaxonomyCategory[];
}
