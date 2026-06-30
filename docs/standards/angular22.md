# Angular 22 Conventions

> Read when writing or reviewing Angular components, services, templates, or routing.

> **Version:** Angular 22 · CLI 22.x · TypeScript 6.x

## Core Paradigm
- **Zoneless** — `provideZonelessChangeDetection()` in `app.config.ts`. No `zone.js` in polyfills.
- **Signals-first** — use `signal()`, `computed()`, `effect()`, `linkedSignal()`.
- **Standalone by default** — do **not** write `standalone: true` in decorators; it is the framework default.
- **`ChangeDetectionStrategy.OnPush`** on every component, no exceptions.
- **Signal Forms** — use `@angular/forms/signals` for all forms. Do not import `ReactiveFormsModule` or `FormsModule` anywhere.
  - Form error arrays are typed `WithFieldTree[]` (imported from `@angular/forms/signals`).
  - Extract the first error with destructuring: `const [error] = errors; const { kind } = error;`
  - Error kind values must use the `ValidationKind` enum from `shared/enums/validation-kind.enum.ts` — never compare `kind` against a string literal.
- **No `model()`** — data down via `input()`, events up via `output()`.

## Dependency Injection
- Use `inject()` function. **No constructor injection.**
- Root-level singleton services use `@Service()`.
- Component-scoped services use `@Service({ autoProvided: false })` listed in the component's `providers` array. Never use `@Injectable()` for new code.

## Component Rules
- **Facades are not root services.** Every facade uses `@Service({ autoProvided: false })` and is listed in its feature component's `providers` array.
- **Smart (Feature) Components:** inject Facades only. Pass data to children via `input()`. Capture events via `output()`.
- **Dumb (Shared) Components:** inject nothing. Use `input()` / `output()` only.
- Use `input.required<T>()` for required inputs.
- Declare all `input()`, `output()`, and query results as `readonly`.
- **No `@HostBinding` or `@HostListener`** — declare host bindings inside the `host: {}` object.

## Signal Queries
- Use signal-based queries exclusively: `viewChild()`, `viewChildren()`, `contentChild()`, `contentChildren()`.
- Never use decorator-based `@ViewChild`, `@ViewChildren`, `@ContentChild`, `@ContentChildren`.

## Templates
- Use **native control flow** — `@if`, `@for`, `@switch`. Never `*ngIf`, `*ngFor`, `*ngSwitch`.
- **No `ngClass`** — use `[class.name]="expr"` bindings.
- **No `ngStyle`** — use `[style.prop]="expr"` bindings.
- Use `@let` to alias long or deeply nested template expressions.
- Use `@defer` to lazy-load heavy or below-the-fold components.

## Animations
- Use `animate.enter="<class>"` and `animate.leave="<class>"` for all enter/leave animations.
- **Do not use or import `@angular/animations`** — deprecated as of v20.2.

## State Management (Signals)
- Use `signal()` for local mutable state. `computed()` for all derived state.
- **Never call `.mutate()`** — use `.set()` for replacement and `.update()` for transforms.
- Use `linkedSignal()` when a writable signal's default must reset in response to another signal.
- Use `effect()` only for genuine side effects (DOM writes, third-party libs). Never to set another signal.
- Use `resource()` for non-HTTP async data sources (Supabase).

## Routing
- All feature routes are **lazy-loaded** via `loadComponent`.
- Auth-protected routes use `canActivate: [authGuard]`.
- **Define route path segments as enums** — never hard-code route strings.

## RxJS Interop
- Prefer signals over observables for all new state.
- Use `takeUntilDestroyed()` when subscribing to observables inside components/services/directives.
- To bridge a signal into an observable: `toObservable()`.
- To bridge an observable into a signal: `toSignal()` with an explicit `initialValue`.

## SCSS Configuration
- `angular.json` is configured with `stylePreprocessorOptions.includePaths: ["src/styles"]`.
- This allows `@use 'abstract/colors' as colors` without relative paths.
- **No `::ng-deep`** — strict encapsulation enforced.

## Component Library Priority
1. **Native platform / framework components** — use these first.
2. **Angular Material** — use when native isn't sufficient.
3. **Nothing else** without explicit sign-off.

## Layer Hierarchy (Core → Shared → Features)
- **Core:** Singletons, interceptors, global state. May only import external libraries.
- **Shared:** Reusable dumb UI, component-scoped services, utilities. May import Core.
- **Features:** Smart components, facades, feature logic. May import Core and Shared.
- **Forbidden:** lower layers importing from higher layers.

## Folder Structure

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
