# CLAUDE.md — Development Standards

This document defines mandatory standards for all code generation, refactoring, and AI-assisted tasks in this repository. These rules override all default behaviors.

---

## Universal Standards (all projects)

### Git Workflow
- **Branches:** `main` (production) · `development` (integration) · `feature/name` · `bugfix/name` · `refactor/name` (optional) · `docs/name`
- **Branch & PR title format:** `type/number-general-description` — e.g. `feature/4-about`, `bugfix/11-navbar-scroll`. Only `feature/` and `bugfix/` branches carry a sequential number. `docs/` and `refactor/` branches are unnumbered — e.g. `docs/claude-commit-policy`, `refactor/angular22-standards`.
- **PR titles** must match the branch name exactly.
- **PRs always target `development`.** Only `development → main` PRs release to production.
- **Never push directly to `main` or `development`.**
- **One PR per feature** — do not batch unrelated changes.
- **Never commit or push** without explicit user approval. Show planned changes first and wait for a go-ahead before any `git commit` or `git push`.

### Planning
- Before implementing any non-trivial feature, save a plan to `plans/feature-name.md`.
- Update `tasks/backlog.md` as work progresses.
- Log bugs in `bugs/open.md`.

### Typing
- **No `any`.** Strict TypeScript enabled in all projects.
- Prefer `unknown` over `any` when the type is genuinely unknown.
- **All `readonly` class properties must have explicit types** even when inferable — e.g. `Signal<string>`, `WritableSignal<boolean>`, `number`, `MyInterface[]`. Never rely on inference for class-level declarations.
- Use `WritableSignal<T>` for `signal()` declarations and `Signal<T>` for `computed()` return types.
- **Prefer `enum` over union string types** — `type State = 'a' | 'b'` should be `enum State { A = 'a', B = 'b' }`.
- Use `InputSignal<T>` as the explicit type annotation for `input()` declarations and `InputSignalWithTransform<T, U>` when a transform is applied. Use `OutputEmitterRef<T>` for `output()` declarations.
- Signal query types: `Signal<T | undefined>` for optional queries, `Signal<T>` for required queries (`.required` variant), and `Signal<readonly T[]>` for `viewChildren()` / `contentChildren()`.

### Enums
- **No literal strings in logic or comparisons** — always define and use an enum.
- Feature-scoped enums live in `features/[name]/enums/`.
- Shared / cross-feature enums live in `shared/enums/[name].enum.ts`.
- **No string comparisons in templates** — expose a `Signal<boolean>` computed in the facade instead (e.g. `isLoading`, `isSuccess`, `isError`).

### Code Style
- **`if` blocks always use braces**, even for single-line bodies.
- **Braces always have inner spaces** in every context — imports, object literals, destructuring.
- **No single-letter or abbreviated identifiers** — method names, variables, and SCSS aliases must be fully descriptive.
- **No alignment padding** — never pad spaces before `=` to vertically align assignments. Use a single space before `=` always.
- **No signal writes or event emissions in templates** — never call `.set()`, `.update()`, or `.emit()` directly in a template expression. Move all writes into a named component method. Expose field signals as `Signal<T>` (not `WritableSignal<T>`) on the component so the template can only read them.

### Naming Conventions (class properties)
- **Static `readonly` properties** (primitives, data arrays, constants) → `CAPITAL_SNAKE_CASE`
- **Reactive properties** (`Signal`, `WritableSignal`, `computed`) → `camelCase`
- **Injected dependencies** (via `inject()`) → `camelCase` private field. No leading underscore, no `$` suffix.
- **Private `WritableSignal` backing a public `Signal<T>`** → prefix with a single underscore: `_name: WritableSignal<T>`. The public surface exposes only a `computed()`.

### Styling — BEM + SCSS
- **BEM** (Block Element Modifier) naming in all stylesheets.
- **No inline styles** unless dynamically computed (e.g. `[style.height]="h()"`)
- Global SCSS partials live in `src/styles/abstract/` and `src/styles/base/`.
- Import global tokens with `@use 'abstract/colors' as colors`, `@use 'abstract/variables' as variables` — **never single-letter aliases**.

### Comments
- Default: **no comments.**
- Only add a comment when the **WHY** is non-obvious: a hidden constraint, a subtle invariant, a workaround for a specific bug.
- Never document WHAT the code does.

### Accessibility
- All interactive elements must be keyboard-navigable.
- No `outline: none` without a custom focus style replacement.
- Must pass all AXE checks and meet WCAG AA minimums.

### i18n (Internationalisation)
- **All static UI text** lives in `src/assets/i18n/en.json`.
- No hard-coded strings in templates or components.
- **JSON keys are `UPPER_SNAKE_CASE`** at every level.
- In facades, use `inject(TranslateService)` + `toSignal(translateService.stream('SECTION'))` to create a `translation: Signal<Record<string, string>>`. Derive individual strings with `computed()`.

### Component Library Priority
1. **Native platform / framework components** — use these first.
2. **Angular Material** — use when native isn't sufficient.
3. **Nothing else** without explicit sign-off.

### Layer Hierarchy (Core → Shared → Features)
- **Core:** Singletons, interceptors, global state. May only import external libraries.
- **Shared:** Reusable dumb UI, component-scoped services, utilities. May import Core.
- **Features:** Smart components, facades, feature logic. May import Core and Shared.
- **Forbidden:** lower layers importing from higher layers.

### Security
- Sanitize all user input at system boundaries.
- Never store secrets in source code or committed `.env` files.

---

## Angular 22 Specifics

> **Version:** Angular 22 · CLI 22.x · TypeScript 6.x

### Core Paradigm
- **Zoneless** — `provideZonelessChangeDetection()` in `app.config.ts`. No `zone.js` in polyfills.
- **Signals-first** — use `signal()`, `computed()`, `effect()`, `linkedSignal()`.
- **Standalone by default** — do **not** write `standalone: true` in decorators; it is the framework default.
- **`ChangeDetectionStrategy.OnPush`** on every component, no exceptions.
- **Signal Forms** — use `@angular/forms/signals` for all forms. Do not import `ReactiveFormsModule` or `FormsModule` anywhere.
- **No `model()`** — data down via `input()`, events up via `output()`.

### Dependency Injection
- Use `inject()` function. **No constructor injection.**
- Root-level singleton services use `@Service()`.
- Component-scoped services use `@Service({ autoProvided: false })` listed in the component's `providers` array. Never use `@Injectable()` for new code.

### Component Rules
- **Facades are not root services.** Every facade uses `@Service({ autoProvided: false })` and is listed in its feature component's `providers` array.
- **Smart (Feature) Components:** inject Facades only. Pass data to children via `input()`. Capture events via `output()`.
- **Dumb (Shared) Components:** inject nothing. Use `input()` / `output()` only.
- Use `input.required<T>()` for required inputs.
- Declare all `input()`, `output()`, and query results as `readonly`.
- **No `@HostBinding` or `@HostListener`** — declare host bindings inside the `host: {}` object.

### Signal Queries
- Use signal-based queries exclusively: `viewChild()`, `viewChildren()`, `contentChild()`, `contentChildren()`.
- Never use decorator-based `@ViewChild`, `@ViewChildren`, `@ContentChild`, `@ContentChildren`.

### Templates
- Use **native control flow** — `@if`, `@for`, `@switch`. Never `*ngIf`, `*ngFor`, `*ngSwitch`.
- **No `ngClass`** — use `[class.name]="expr"` bindings.
- **No `ngStyle`** — use `[style.prop]="expr"` bindings.
- Use `@let` to alias long or deeply nested template expressions.
- Use `@defer` to lazy-load heavy or below-the-fold components.

### Animations
- Use `animate.enter="<class>"` and `animate.leave="<class>"` for all enter/leave animations.
- **Do not use or import `@angular/animations`** — deprecated as of v20.2.

### State Management (Signals)
- Use `signal()` for local mutable state. `computed()` for all derived state.
- **Never call `.mutate()`** — use `.set()` for replacement and `.update()` for transforms.
- Use `linkedSignal()` when a writable signal's default must reset in response to another signal.
- Use `effect()` only for genuine side effects (DOM writes, third-party libs). Never to set another signal.
- Use `resource()` for non-HTTP async data sources (Supabase).

### Routing
- All feature routes are **lazy-loaded** via `loadComponent`.
- Auth-protected routes use `canActivate: [authGuard]`.
- **Define route path segments as enums** — never hard-code route strings.

### RxJS Interop
- Prefer signals over observables for all new state.
- Use `takeUntilDestroyed()` when subscribing to observables inside components/services/directives.
- To bridge a signal into an observable: `toObservable()`.
- To bridge an observable into a signal: `toSignal()` with an explicit `initialValue`.

### SCSS Configuration
- `angular.json` is configured with `stylePreprocessorOptions.includePaths: ["src/styles"]`.
- This allows `@use 'abstract/colors' as colors` without relative paths.
- **No `::ng-deep`** — strict encapsulation enforced.

### Folder Structure

```
src/
├── app/
│   ├── core/
│   │   ├── errors/           # AppError subclasses, error-mapper, error-messages.const
│   │   ├── guards/           # authGuard
│   │   ├── types/            # Result<T> type + helpers
│   │   └── services/
│   │       ├── data/         # Supabase API functions (one file per domain)
│   │       └── platform/     # supabase.service.ts, auth.service.ts
│   ├── shared/
│   │   ├── components/       # Dumb UI components
│   │   ├── enums/
│   │   └── utils/
│   ├── features/
│   │   ├── auth/
│   │   ├── progress/
│   │   ├── session/
│   │   ├── daily-log/
│   │   ├── kpi/
│   │   ├── profile/
│   │   ├── goals/
│   │   ├── settings/
│   │   └── menu/
│   ├── app.ts
│   ├── app.config.ts
│   └── app.routes.ts
├── assets/
│   └── i18n/
│       └── en.json
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
└── styles/
    ├── abstract/   # _colors.scss, _variables.scss, _mixins.scss
    └── base/       # _reset.scss, _typography.scss
```

---

## Progress App — Project-Specific Rules

### Domain Naming
| Term | Definition |
|------|------------|
| Subject | Workout routine ("Monday Practice", "Leg Day") |
| Entry | A performed session on a date |
| Item | Exercise within an entry ("Deadlift") |
| Set | Weight/reps record per item |
| Feedback | Rating per item: `success`, `hard`, `fail` |
| Goal | Target for next session per item |
| Template | Preconfigured exercises for a subject |
| DailyLog | Daily health metrics (sleep, weight, water, waist) |
| HealthGoal | Target health metrics (sleep target, water target, etc.) |

### Supabase Integration — CRITICAL OVERRIDES

The Supabase JS client is **not** Angular's HttpClient. These rules override the portfolio HTTP section:

- `SupabaseService` in `core/services/platform/supabase.service.ts` — singleton providing the `SupabaseClient`.
- Data services use **`resource()`** (NOT `httpResource()`) — Supabase returns Promises, not HTTP observables.
- **`BaseDataService` does NOT apply** — Supabase services define their own `resource()`.
- All Supabase calls return **`Result<T, AppError>`** — never throw, never expose raw errors.
- Validate all Supabase responses with **Zod** before returning.
- After mutations, call `.reload()` on the relevant `resource()` to re-sync.

### Result Type

Located at `src/app/core/types/result.ts`:
```ts
export type Result<T, E extends AppError = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };
```
Helpers: `ok()`, `err()`, `isOk()`, `isErr()`.

### API Function Pattern

Located in `core/services/data/`. Each function takes a `SupabaseClient` and returns `Promise<Result<T>>`:
```ts
export async function getSubjects(
  supabase: SupabaseClient,
  userId: string
): Promise<Result<Subject[]>> {
  const { data, error } = await supabase.from('subjects').select('*').eq('user_id', userId);
  if (error) {
    return err(mapSupabaseError(error));
  }
  const validated = subjectArraySchema.safeParse(data);
  if (!validated.success) {
    return err(new ValidationError('Invalid data'));
  }
  return ok(validated.data);
}
```

### i18n — ngx-translate v18
- Providers: `provideTranslateService({ defaultLanguage: 'en' })` + spread `...provideTranslateHttpLoader()`.
- No `TranslateModule`.
- In facades: `inject(TranslateService)` + `toSignal(translateService.stream('SECTION'))`.

### Database Migration Rules
ALL migrations must be backwards compatible — no column drops, no data loss.
New migrations use sequential numbering starting at 012.

### Delete (Subjects)
Hard delete via `supabase.from('subjects').delete()`. DB `ON DELETE CASCADE` removes all entries → items → item_sets → item_feedback. UI confirms with affected data count.

### Google OAuth
`supabase.auth.signInWithOAuth({ provider: 'google' })`, callback at `/auth/callback`.
Callback component exchanges the code for a session and redirects to `/progress`.
