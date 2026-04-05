## Phase {N}: {Title}

### What this PR does
<!-- Brief description of the changes -->

### Scope
<!-- What this PR implements. Be specific — list files, features, components. -->

- 

### NOT in scope (deferred to later phases)
<!-- List items intentionally deferred to later phases. This prevents reviewers
     (including @claude bot) from flagging known future work as issues.
     Copy relevant items from PROGRESS.md. -->

- **Phase {N+1}:**
- **Phase 5 (Polish):** Unit tests, responsive design, loading skeletons, error boundaries

> **For reviewers:** Do NOT flag items listed in "NOT in scope" as issues.
> They are tracked in PROGRESS.md and will be addressed in their designated phase.

### How to test

1. `pnpm install && pnpm dev`
2. 

### Checklist

- [ ] `pnpm lint` passes
- [ ] `pnpm build --filter web` passes
- [ ] Tested locally in browser
- [ ] shadcn/ui components used (not raw HTML elements)
- [ ] Design tokens used (no hardcoded colors)
- [ ] Forms use react-hook-form + Zod from @repo/shared

### Screenshots

<!-- Before/after if UI changed, delete section if not applicable -->
