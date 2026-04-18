# BookShare — Web UI Kit

High-fidelity click-thru recreation of the BookShare web app.

## Files
- `index.html` — boots the full prototype (sign in → browse → book detail → request flow → My Library → Requests tabs). Persists route/theme/user in localStorage.
- `Icons.jsx` — Lucide wrappers used across the kit.
- `Primitives.jsx` — `Button`, `Badge`, `Input`, `Textarea`, `Label`, `Tabs*`. One-to-one with `packages/ui/src/components/*.tsx` in the repo.
- `Components.jsx` — product-specific: `Header`, `BookCover`, `BookCard`, `BookGrid`, `BookFilters`, `BorrowRequestCard`, `BorrowRequestForm`.
- `Pages.jsx` — `SignInPage`, `SignUpPage`, `BrowsePage`, `MyLibraryPage`, `BookDetailPage`, `RequestsPage`.
- `data.js` — seed books + borrow requests.
- `kit.css` — `.kit-*` classes, built on top of `colors_and_type.css` tokens.

## Flows covered
- **Auth:** Sign In ↔ Sign Up (with password-mismatch error).
- **Browse:** live title/author search + genre dropdown + grid of available community books.
- **Book Detail:** cover, metadata badges, owner card, borrow-request form → success banner → pending-status echo.
- **My Library:** add book form, lendable toggle, delete-on-hover overlay with blur, empty state.
- **Requests:** Incoming/Outgoing tabs, pending count, status state machine (pending → approved → handed_over → returned), deny/cancel paths.
- **Theme toggle** in header, dark-mode persisted.

## Caveats
- No bespoke book covers — we render gradient-tinted text panels in place of Google Books images.
- Profile page is a placeholder (as in the real repo — "coming in Phase 4").
- The `AddBookForm` is simplified: no Google Books API search (repo has one; we omit it for the mock).
