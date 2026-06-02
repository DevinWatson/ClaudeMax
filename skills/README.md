# Skills

Each skill is a directory at `skills/<category>/<name>/` containing a `SKILL.md` (plus
optional `scripts/`, `references/`, `assets/`). The skill's `name:` must match the
directory name. Skills are reusable procedures that **back** agents — an agent lists the
skills it depends on in its `skills:` frontmatter.

- **Create one:** `npm run new:skill -- --name <name> --category <id> --description "…"`
- **Standards:** [`meta/skill-authoring`](meta/skill-authoring/SKILL.md)
- **Browse everything:** [`../catalog/CATALOG.md`](../catalog/CATALOG.md)

Run `npm run validate` before committing.
