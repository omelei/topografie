# Working agreements

Lessons from earlier sessions on this repository. They apply to every session,
local or in the cloud.

## Git and pull requests

- Every commit is authored as `omelei <j.weijs@gmail.com>`, never a work
  address. In a fresh clone, Codespace or cloud session, check
  `git log -1 --format='%an <%ae>'` before pushing.
- Work on a branch off `origin/main` and open a pull request. Merging is the
  owner's job: a merge to `main` is the deploy. Say which PRs to merge and in
  which order, and do not run `gh pr merge`.
- PRs are squash-merged and the branch is kept. A stacked PR then still points
  at its old base: `gh pr edit <n> --base main`, then
  `git rebase --onto origin/main <old-tip> <branch>`.
- Stage by path. `git add -A docs/` has twice picked up untracked files.
- Several sessions work at once. Before committing an ADR, `git fetch` and take
  the next free number from
  `git show origin/main:docs/DECISIONS.md | grep '^## ADR-1'`. On a collision,
  renumber in its own commit and keep main's ADR first.
- Verify rewrites against `git show HEAD:<file>`; the working tree may have
  changed branch during the session.

## Roadmap

- `docs/ROADMAP.md` is what the owner reads to see where things stand. A PR that
  picks up, finishes, parks or adds an item updates it in the same PR: move the
  item, set the date at the top, and add the PR to "Gedaan (recent)". A PR that
  touches nothing on it leaves it alone.

## CI

- `ci.yml` runs on `pull_request` and on push to `main` only. A pushed branch
  without a PR gets no checks.
- The `check` job runs `prettier --write` and pushes a "Run Prettier" commit
  back to the branch. A formatting slip does not fail the build; pull that
  commit before pushing again. The run on the bot commit waits for approval;
  the run before it is the real result.
- If `push --force-with-lease` reports stale info after a rebase, the Prettier
  bot pushed in between: fetch, cherry-pick its commit, push again.
- Deploy is a job inside the `main` run and is skipped when any e2e shard
  fails. Before calling something live, check the `deploy` job of the last
  `main` run, not only the PR checks. Tell the owner to merge only when every
  check is green, e2e included.
- An e2e shard stops after four failures, so a red run can hide more.
- Every run uploads a `screenshots` artifact (all sizes, Chromium and WebKit).
  Use it to review layout; add a `shoot()` step in `e2e/screens.spec.ts` for any
  new page.
- `export *` in `src/game-core/index.ts` fails on duplicate names (TS2308): grep
  the exports before naming something.
- Playwright `getByRole` name matching is by substring; use `exact: true` for
  short names.

## Prettier rules that are easy to get wrong by hand

- A member chain with more than two calls, where any argument is not a plain
  literal (a regex counts), is broken onto one call per line whatever its width.
- A call that fits in 100 columns is joined back onto one line; do not pre-break
  it.
- A JSX element with children stays on one line only with at most one
  attribute. Two or more attributes put the children on their own lines.
- In CSS, a comment must be indented to its brace depth.
- In Markdown, emphasis is `_word_`, not `*word*`; at most one blank line.

## Texts

- Every visible text follows `docs/SCHRIJFWIJZER.md`: its tone, its word list
  (one concept, one word) and its feedback pattern. Read it before writing or
  changing a string in `src/i18n/nl.ts`.

## CSS and design

- Before introducing or renaming a `tk-` class, grep `src/index.css` and the
  `.tsx` files for it. Short Dutch nouns (teken, pil, kaart) are already taken.
- Design tests check tokens, not structure. After removing CSS by script, remove
  from the back, never a parent together with its children, and read the removed
  lines in `git diff`.

## Checking the live site

- Deep links answer HTTP 404 on purpose: `tools/spa-fallback.mjs` makes
  `404.html` a copy of the app.
- To confirm a change shipped, grep the live CSS and JS bundles for the new
  class or string rather than opening the site.
