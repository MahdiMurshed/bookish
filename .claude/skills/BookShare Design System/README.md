# BookShare Design System

A design system extracted from the **BookShare** (a.k.a. `bookish`) monorepo — a book-lending platform for friends and book clubs. Add your books, mark them lendable, borrow from each other, chat per-request, rate and review.

- **Live product:** https://bookish-mauve-beta.vercel.app/
- **Source repo:** [MahdiMurshed/bookish](https://github.com/MahdiMurshed/bookish) @ `master`
- **Stack:** React 19 + Vite 7 + TypeScript, TailwindCSS 4, shadcn/ui, Supabase, TanStack Query, React Hook Form + Zod
- **Monorepo:** Turborepo + pnpm — design primitives live in `packages/ui/src/styles/globals.css` and `packages/ui/src/components/*`.

The product is a single-surface web app with five core pages: **Sign In / Sign Up**, **Browse** (community bookshelf), **My Library**, **Book Detail** (with borrow request form), and **Requests** (incoming/outgoing tabs). Dark mode is first-class via `next-themes`. All components originate from shadcn/ui and Radix primitives.

---

## Index

| File | What it is |
|---|---|
| `README.md` | This document — context, fundamentals, iconography. |
| `SKILL.md` | Cross-compatible skill definition (Agent Skills / Claude Code). |
| `colors_and_type.css` | Source-of-truth CSS custom properties (color + radius + type). Drop-in. |
| `preview/*.html` | Small atomic cards rendered in the Design System tab (colors, type, components, etc.). |
| `ui_kits/web/` | High-fidelity recreation of the web app — pages as JSX, `index.html` boots a click-thru prototype. |
| `_reference/` | Verbatim imports from the source repo: `shadcn-components/*.tsx`, `styles/globals.css`, `lib/utils.ts`. Read-only reference; do NOT re-import these into designs — use `colors_and_type.css` + the UI kit instead. |

---

## Content Fundamentals

**Voice is plain, direct, and friendly.** No marketing sheen, no exclamation-pointed enthusiasm, no emoji. The product speaks to a small, trusted audience (friends, book clubs), so copy reads like a helpful peer, not a brand.

- **Pronouns:** Product addresses the user as **"you"** and speaks of their things as **"your library," "your books," "your requests."** First-person ("My Library") is used for navigation labels that describe possessive sections.
- **Casing:** **Title Case** on page H1s and nav items (`My Library`, `Community Bookshelf`, `Borrow Requests`, `Sign In`). **Sentence case** for body, hints, and placeholder text.
- **Length:** Most strings are 1–6 words. Page subtitles are one short sentence. Example pairs actually in the app:
  - H1 `My Library` · sub `{n} book{s}`
  - H1 `Community Bookshelf` · sub `Books available to borrow from the community`
  - H1 `Borrow Requests` · sub `Manage incoming and outgoing borrow requests`
  - H1 `Create Account` · sub `Join BookShare and start sharing books`
- **Actions:** Verbs lead, always imperative. `Add Book`, `Send Request`, `Hand Over`, `Mark Returned`, `Sign Out`, `Dismiss`. Never "Click here," never "Submit."
- **Empty states:** One sentence, factual, with a secondary CTA link underneath.
  - `Your library is empty.` → `Add your first book`
  - `No books available yet. Be the first to share a book!` (the *only* `!` in the codebase — and it's earned.)
  - `No incoming borrow requests yet.`
  - `You haven't made any borrow requests yet.`
- **Errors:** Short, declarative, no blame. `Book not found.` `Passwords do not match` `Failed to sign in` `Could not check your request status. Please refresh the page.`
- **Success:** Minimal, past-tense confirmation. `Request sent! The owner will be notified.` `Password reset email sent. Check your inbox.`
- **Status labels:** Title-cased single words/phrases. `Pending`, `Approved`, `Handed Over`, `Returned`, `Denied`, `Cancelled`.
- **Micro-copy:** Placeholder text is conversational. `"Let the owner know why you'd like to borrow this book..."`, `"Search by title or author..."`, `"you@example.com"`.
- **No emoji. No iconography-as-text.** Icons come from Lucide; see Iconography.
- **Curly quotes** are used in user-generated echoes (`&ldquo;…&rdquo;`) when quoting borrow request messages.

---

## Visual Foundations

BookShare is a **neutral, content-forward, shadcn-default** system. It is intentionally restrained: the product is about books (which bring their own color via cover art), so the chrome gets out of the way.

### Color
- **All core tokens are achromatic** (chroma = 0 in oklch). The palette is pure black→white grayscale for foreground/background/border/muted/input/ring.
- **Chromatic colors appear only in three semantic slots:**
  - `--destructive` — red `oklch(0.577 0.245 27.325)` (hue ~27°, error toasts, delete)
  - `--success` — green `oklch(0.65 0.19 145)` (hue 145°, "Request sent" banner, "Available to borrow" badge)
  - `--warning` — amber `oklch(0.75 0.15 85)` (hue 85°, reserved, unused today)
  - `--availability` — a brighter green used *only* for the round availability dot on `BookCard` (tailwind `green-500` / `oklch(0.723 0.219 149.579)`)
- **Dark mode flips the whole thing** via a `.dark` class on `<html>`. Background goes near-black (`oklch(0.145 0 0)`), foreground near-white. Chromatic tokens pick darker, slightly-less-saturated variants.
- **No gradients.** None. Anywhere. Not in backgrounds, not in buttons, not in heroes.
- **No purple-blue AI slop.** If you find yourself reaching for indigo/violet, stop.

### Typography
- **Single family: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", …`** — i.e. whatever the OS offers. The repo does not ship a webfont. Our `colors_and_type.css` substitutes **Inter** (Google Fonts) for cross-environment consistency — ⚠️ *flag: substitution. Swap to your real system stack or confirm Inter is acceptable.*
- **Scale is small and tight.** Page H1 = `text-2xl` (24px) bold, section H2 = `text-lg` (18px) medium, body = `text-sm` (14px) regular, meta = `text-xs` (12px) muted. No display/jumbo sizes anywhere.
- **Weights used:** 400 / 500 / 600 / 700. 500 is doing the most work.
- **Tracking:** default. No negative letter-spacing tricks.
- **Line-height:** tailwind default (1.5). `leading-relaxed` on book descriptions.

### Spacing & Layout
- **Max-width containers:** `max-w-md` (sign-in), `max-w-3xl` (requests), `max-w-4xl` (book detail), `container mx-auto` with `px-4 py-8` for full pages.
- **Grid rhythm:** books display in a responsive grid — `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5` with `gap-4`.
- **Header is 56px** (`h-14`) with a bottom border.
- **Vertical rhythm:** `space-y-6` between major sections, `space-y-4` inside forms, `space-y-2` for label+field.
- **Card padding:** `p-3` on book cards, `p-4` on larger cards, `p-4` on forms.

### Borders, Radii, Elevation
- **Borders are ubiquitous and quiet** — 1px `var(--border)` (a very pale gray in light, near-black-gray in dark). Cards *always* have a border, rarely a shadow.
- **Radius scale:** `--radius: 0.625rem` (10px) is the base. Derived: `sm 6 / md 8 / lg 10 / xl 14`. Badges are full-pill (`rounded-full`). Inputs and buttons land on `rounded-md` (8px). Cards on `rounded-lg` (10px). Book covers on `rounded-lg`.
- **Shadows are minimal.** `shadow-xs` on inputs/buttons (just a 1px rgba stripe), `shadow-sm` on hover for cards. Nothing dramatic, nothing colored, no inner shadows.
- **No protection gradients.** Overlays on covers are solid `bg-card/90 backdrop-blur-sm` (the only blur in the app — see `MyLibrary`'s overlay row on book cards).

### Interaction — hover, focus, press
- **Hover** on primary surfaces: `bg-primary/90` (slightly-transparent primary). On ghost/secondary: `bg-accent`. On links: `underline` appears.
- **Focus** is consistent and visible: `focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50`. A 3px halo at 50% opacity.
- **Disabled:** `opacity-50` + `pointer-events-none`. Flat, no cross-hatch.
- **No press-state shrink, no scale transforms.** Transitions are `transition-all` or `transition-[color,box-shadow]` — color + shadow only, never scale.
- **Animation:** essentially none beyond the theme-toggle icon swap (`rotate` + `scale` swap between sun/moon). No page transitions, no list reveals, no bounces. The system is still.

### Imagery
- **Book covers carry the color.** They're the only consistent source of warmth/hue in the product — the UI is deliberately neutral to let them read.
- **Aspect ratio is locked:** `aspect-[2/3]` for covers. `object-cover`. When missing, a centered `BookOpen` Lucide icon on `bg-muted` at `text-muted-foreground/40`.
- **No illustrations, no photography beyond book covers, no patterns, no textures, no grain.**

### Transparency & Blur
- Transparency via opacity-suffixed Tailwind tokens: `bg-destructive/10`, `bg-primary/5`, `bg-success/15`, `bg-card/90`, `text-muted-foreground/40`.
- **Blur is used exactly once:** `backdrop-blur-sm` on the hover-overlay row on book cards in `My Library`.

### Cards
- 1px border, `rounded-lg` (10px), `bg-card`, no shadow by default. On hover, `shadow-sm` optionally (only `BookCard` uses this). Padding `p-3` or `p-4` depending on density.

---

## Iconography

- **Icon library:** **[Lucide](https://lucide.dev/)** via `lucide-react`. Every icon in the app is a Lucide component.
- **Style:** single-weight line icons, 2px stroke, rounded joins. Consistent throughout.
- **Sizes:** icons are inline with text — `h-4 w-4` (16px) next to `text-sm` labels, `h-5 w-5` (20px) for the logo `BookOpen`, `h-12 w-12` / `h-16 w-16` for empty-state fallbacks on book covers (rendered at `text-muted-foreground/40` opacity).
- **Icons seen in the codebase:** `BookOpen` (logo, book fallback), `Library` (nav), `ArrowRightLeft` (requests nav), `User` (profile nav), `Plus` (add book), `Search` (filter input), `Send` (submit borrow request), `Check` (success), `Sun` / `Moon` (theme toggle).
- **Delivery in this design system:** we load Lucide from CDN (`https://unpkg.com/lucide@latest`) in the UI kit. No icon font, no sprite, no bespoke SVGs.
- **Emoji:** never used.
- **Unicode chars as icons:** only curly quotes in quoted message echoes. No arrows, no bullets, no mathematical operators used as visual elements.
- **Favicon / logo:** no bespoke logo mark in the repo — the brand "logo" is literally `<BookOpen /> BookShare` in 18px bold. Treated as a wordmark with a glyph. If a true logo is ever needed, **flag the gap and ask for one.**

---

## Caveats & Substitutions

- **Fonts:** The repo ships no webfont — it uses the OS system-ui stack. We substituted **Inter** (Google Fonts) for cross-environment previews. Real production builds should keep the system stack or explicitly ship a webfont.
- **Logo:** There is no dedicated logo asset. The `BookOpen` Lucide glyph + the word "BookShare" in bold is the entire brand mark today.
- **No slides** in the source — this design system does not include a slide template.
