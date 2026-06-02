# Agents

Each agent is a single markdown file at `agents/<category>/<name>.md`. The folder is the
agent's taxonomy category (see [`../taxonomy.json`](../taxonomy.json)); `<name>` must match
the file's `name:` frontmatter field.

- **Create one:** `npm run new:agent -- --name <name> --category <id> --description "…"`
- **Standards:** [`skills/meta/agent-authoring`](../skills/meta/agent-authoring/SKILL.md)
- **Browse everything:** [`catalog/CATALOG.md`](../catalog/CATALOG.md)

Run `npm run validate` before committing. Agents are discovered recursively, so deeper
subfolders (e.g. `agents/languages/jvm/kotlin-pro.md`) are fine as long as the first path
segment is a valid category.
