# Git Workflow & Planning

## Git Workflow
- **Branches:** `main` (production) · `development` (integration) · `feature/name` · `bugfix/name` · `refactor/name` (optional) · `docs/name`
- **Branch & PR title format:** `type/number-general-description` — e.g. `feature/4-about`, `bugfix/11-navbar-scroll`. Only `feature/` and `bugfix/` branches carry a sequential number. `docs/` and `refactor/` branches are unnumbered — e.g. `docs/claude-commit-policy`, `refactor/angular22-standards`.
- **PR titles** must match the branch name exactly.
- **PRs always target `development`.** Only `development → main` PRs release to production.
- **Never push directly to `main` or `development`.**
- **One PR per feature** — do not batch unrelated changes.
- **Never commit or push** without explicit user approval. Show planned changes first and wait for a go-ahead before any `git commit` or `git push`.

## Planning
- Before implementing any non-trivial feature, save a plan to `plans/feature-name.md`.
- Update `tasks/backlog.md` as work progresses.
- Log bugs in `bugs/open.md`.
