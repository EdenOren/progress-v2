# CLAUDE.md — Development Standards

Mandatory rules for all code generation and AI-assisted tasks in this repo. These override default behavior.

## Non-negotiable
- Never commit or push without explicit user approval — show planned changes first and wait for a go-ahead.
- No `any`. Strict TypeScript everywhere; prefer `unknown` when genuinely unknown.
- No string-literal comparisons in logic, templates, or conditionals — always use an enum.
- Save a plan to `plans/feature-name.md` before implementing any non-trivial feature.

## Stack
Angular 22 (zoneless, signals-first, standalone) + Supabase, TypeScript strict mode.

## Reference Docs

Always loaded:
@docs/standards/git-and-planning.md
@docs/standards/typescript-and-style.md

Read on demand:
- `docs/standards/angular22.md` — Angular 22 conventions (DI, signals, templates, routing, folder structure). Read when writing or reviewing Angular components/services.
- `docs/standards/supabase.md` — Supabase integration, Result type, API function pattern, migrations. Read when working on data services or migrations.
- `docs/progress-app.md` — Progress app domain glossary, i18n setup, delete/OAuth rules. Read when working on Progress-app feature logic.
