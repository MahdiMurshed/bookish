---
name: sync-design-system
description: Mirror packages/ui/src/{components,styles,lib} into the BookShare Design System skill's _reference/ snapshot, then surface follow-up suggestions for ui_kits, preview, README, and Lucide icon registry. No-op when nothing has drifted.
user-invocable: true
---

# /sync-design-system

Keep the BookShare Design System skill's `_reference/` mirror in sync with the actual `packages/ui/` source of truth, and surface what *might* need a manual follow-up.

`_reference/` is a verbatim, read-only snapshot of `packages/ui/src/{components,styles,lib}`. The skill uses it so its rules and examples never drift from the real codebase. This command refreshes that snapshot.

`ui_kits/`, `preview/`, `colors_and_type.css`, `README.md`, and `SKILL.md` are **conceptual** layers — this skill never edits them. It just *flags* when they probably need attention.

## Path map

| Source (truth) | Destination (mirror) |
|---|---|
| `packages/ui/src/components/*.tsx` | `.claude/skills/BookShare Design System/_reference/shadcn-components/` |
| `packages/ui/src/styles/globals.css` | `.claude/skills/BookShare Design System/_reference/styles/globals.css` |
| `packages/ui/src/lib/utils.ts` | `.claude/skills/BookShare Design System/_reference/lib/utils.ts` |

## Steps

### Step 1: Detect drift

Run these from the repo root:

```bash
# Components — recursive diff
diff -rq packages/ui/src/components ".claude/skills/BookShare Design System/_reference/shadcn-components"

# Single files
diff -q packages/ui/src/styles/globals.css ".claude/skills/BookShare Design System/_reference/styles/globals.css"
diff -q packages/ui/src/lib/utils.ts ".claude/skills/BookShare Design System/_reference/lib/utils.ts"
```

Categorize the output:
- **New** — `Only in packages/ui/src/components: <file>`
- **Removed** — `Only in .../_reference/shadcn-components: <file>`
- **Modified** — `Files <a> and <b> differ`

If everything matches, print `Design system reference is in sync. Nothing to do.` and skip to Step 4 (the Lucide check still runs — it inspects a different concern).

### Step 2: Mirror new and modified files

For each new or modified file, copy it from source to destination with an explicit `cp`. Show each command so the user sees what's mirrored:

```bash
cp packages/ui/src/components/<name>.tsx ".claude/skills/BookShare Design System/_reference/shadcn-components/<name>.tsx"
```

Do not batch with wildcards — one explicit `cp` per file.

### Step 3: Handle removals

If a file exists in `_reference/` but not in the source, **do not delete automatically.** Ask:

> `<filename>` was removed from `packages/ui`. Delete it from `_reference/` too? (y/n)

Only delete on explicit `y`.

### Step 4: Detect new Lucide icons

The skill's `ui_kits/web/Icons.jsx` registers a small set of icons on `window.Icon` for the click-thru prototype. Real production code imports directly from `lucide-react`, so the registry can fall behind silently.

Find icons currently imported in the repo:

```bash
grep -rhoE "import \{[^}]+\} from ['\"]lucide-react['\"]" apps/web packages/ui/src 2>/dev/null \
  | sed -E "s/.*\{([^}]+)\}.*/\1/" | tr ',' '\n' | tr -d ' ' | sort -u
```

Compare against the registry keys in `.claude/skills/BookShare Design System/ui_kits/web/Icons.jsx` (lines around `window.Icon = {`).

List any icons used in the repo but missing from the registry under "Lucide icons" in the report below.

### Step 5: Print the report

Use this format:

```
Design system synced.

Mirrored into _reference/:
  - shadcn-components/<name>.tsx (new | modified)
  - styles/globals.css (modified)
  - lib/utils.ts (modified)

Removed from _reference/ (with confirmation):
  - shadcn-components/<name>.tsx

Consider updating manually:

  Tokens — colors_and_type.css:
  - globals.css changed. Diff it against colors_and_type.css and
    propagate any new --* custom properties.

  New surface — README.md / SKILL.md:
  - <name>.tsx is a new UI primitive. May warrant a paragraph in
    README.md → "Visual Foundations" or a new section.

  Mock recreations — ui_kits/web/Components.jsx:
  - <name>.tsx — add a JSX recreation if it'll appear in click-thru
    prototypes.

  Showcase cards — preview/:
  - <name>.tsx — add preview/<name>.html if visually distinctive enough
    to warrant a Design System tab card.

  Lucide icons — ui_kits/web/Icons.jsx + preview/icons-lucide.html:
  - <icon-name> is imported in the repo but missing from the registry.
```

Only include sections that have items. Keep the report tight.

## Notes

- Writes ONLY to `_reference/`. Never touches `ui_kits/`, `preview/`, `colors_and_type.css`, `README.md`, or `SKILL.md`.
- Safe to run repeatedly — clean state is a no-op.
- Removals require explicit confirmation; everything else is automatic.
- The Lucide check is a separate pass and runs even when `_reference/` is in sync — drift in the icon registry is independent of file-level drift.
- After this skill runs, any new files in `_reference/` will appear as uncommitted changes. Whichever skill invokes this one is responsible for committing them (typically `/done` or `/phase complete`).
