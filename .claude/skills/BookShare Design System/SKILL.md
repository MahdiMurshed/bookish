---
name: bookshare-design
description: Use this skill to generate well-branded interfaces and assets for BookShare (a.k.a. bookish), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. Use `colors_and_type.css` for tokens and `ui_kits/web/kit.css` + `ui_kits/web/*.jsx` for components.

If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand. The source of truth lives in `_reference/` — verbatim imports from the MahdiMurshed/bookish repo.

Key rules:
- Neutral achromatic palette. Color only appears as book covers, the green availability dot, success/destructive/warning semantic states.
- No gradients, no emoji, no bespoke SVGs. Icons come from Lucide.
- Tailwind v4 + shadcn/ui conventions. Radius base is 10px. Radii are md/lg for inputs/cards.
- Voice: plain, direct, "you"-addressed. Title Case for headings, sentence case for body. Verb-leading imperative CTAs.
- Dark mode is first-class via `.dark` class on `<html>`.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
