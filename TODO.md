# I ❤️ USH — Add-on Ideas

Items are grouped by category. No priority order within sections.

---

## Gameplay

- **Difficulty modes** — Easy (3 min, AI shows 5 guesses), Hard (90 sec, AI shows 1 guess, stricter rule check)
- **Skip penalty** — Deduct a point (or fraction) for skipping, to discourage farming easy terms
- **Hint system** — Press a button to reveal the topic/unit as a hint at a score cost (-0.5 pts)
- **Clue history** — Let the player see their previous clues for the current term so they can try different angles
- **Custom timer** — Let player choose session length (60s / 90s / 120s / 180s) on the start screen
- **Practice mode** — Untimed, unlimited hints, no violations — useful for studying

---

## Term Bank

- **Expand to all 8 units** — Verify every unit has full coverage; add missing terms from the AP USH curriculum
- **Difficulty rating per term** — Tag each term as easy / medium / hard; weight random selection to balance sessions
- **Term images** — Attach an optional image URL to terms (portraits, maps, documents) shown in the summary
- **Community term submissions** — Simple form (name + definition) that writes to a Google Sheet for review

---

## AI / Matching

- **Confidence threshold feedback** — Show a progress bar filling toward the win threshold so players know how close they are
- **Top-guess confidence color** — Color the top guess green/yellow/red based on cosine score proximity to win threshold
- **Wrong-guess explanations** — In the summary, show why the AI ranked a wrong term highly (shared keywords)
- **Model upgrade path** — Document how to swap to `bge-base-en-v1.5` if accuracy becomes a concern; current `bge-small` is fast but less precise

---

## Multiplayer / Social

- **Shared session link** — Generate a URL with a seed so two players get the same term sequence (race mode)
- **Describe-for-someone-else mode** — Player A describes, Player B guesses (no AI, pure party game)
- **Leaderboard** — Store top scores in a lightweight backend (Cloudflare KV / Supabase) keyed by initials
- **Share score card** — "I scored 8/10 on I ❤️ USH" image card for social sharing

---

## UI / UX

- **Mobile layout** — Fix textarea + guesses panel stacking on small screens; ensure soft keyboard doesn't cover guesses
- **Keyboard shortcut** — `Tab` to skip, `Esc` to go home (with confirmation), `Enter` to submit if in practice mode
- **Animated score counter** — Tick up the score number on win instead of instant update
- **Dark mode** — Honor `prefers-color-scheme: dark`
- **Accessibility** — Add ARIA labels to timer, guesses panel, and textarea; announce violations to screen readers
- **Loading skeleton** — Replace plain text status with a styled skeleton while the AI model loads on first visit
- **Confetti on high score** — Small confetti burst when player beats their personal best

---

## Infrastructure

- **Deploy to Vercel** — Set up CI/CD with `vercel --prod` on main branch push
- **PWA / offline mode** — Add `next-pwa` so the app installs on desktop/mobile and runs offline after first load
- **Analytics** — Add Plausible or Vercel Analytics to track session counts and popular units
- **Automated cache-key bump** — Script that hashes `terms.ts` content and auto-updates the cache key in `embeddingCache.ts` so stale embeddings are always invalidated on term edits
- **Remove dead files** — Delete `src/data/terms 2.ts` (legacy, unused) and `src/lib/similarity.ts` (unused utility)

---

## Polish / Minor

- **Favicon** — Custom heart/book favicon instead of default Next.js one
- **Open Graph image** — Add a `/og` route so link previews look good when shared
- **404 page** — Styled "page not found" consistent with app theme
- **About / credits page** — Small footer page with Stanley Ho credit, tech stack, and model attribution (BGE-small license)
