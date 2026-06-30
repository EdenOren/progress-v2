# TypeScript & Code Style

## Typing
- **No `any`.** Strict TypeScript enabled in all projects.
- Prefer `unknown` over `any` when the type is genuinely unknown.
- **All `readonly` class properties must have explicit types** even when inferable — e.g. `Signal<string>`, `WritableSignal<boolean>`, `number`, `MyInterface[]`. Never rely on inference for class-level declarations.
- Use `WritableSignal<T>` for `signal()` declarations and `Signal<T>` for `computed()` return types.
- **Prefer `enum` over union string types** — `type State = 'a' | 'b'` should be `enum State { A = 'a', B = 'b' }`.
- Use `InputSignal<T>` as the explicit type annotation for `input()` declarations and `InputSignalWithTransform<T, U>` when a transform is applied. Use `OutputEmitterRef<T>` for `output()` declarations.
- **Always annotate local variables explicitly** when the inferred type is not obvious from the right-hand side — e.g. `const errors: WithFieldTree[] = field().errors()`.
- Signal query types: `Signal<T | undefined>` for optional queries, `Signal<T>` for required queries (`.required` variant), and `Signal<readonly T[]>` for `viewChildren()` / `contentChildren()`.

## Enums
- **No literal strings in logic or comparisons** — always define and use an enum.
- Feature-scoped enums live in `features/[name]/enums/`.
- Shared / cross-feature enums live in `shared/enums/[name].enum.ts`.
- **No string comparisons in templates** — expose a `Signal<boolean>` computed in the facade instead (e.g. `isLoading`, `isSuccess`, `isError`).

## Code Style
- **`if` blocks always use braces**, even for single-line bodies — and the body is always on its own line (never `if (x) { return ''; }` on one line).
- **Braces always have inner spaces** in every context — imports, object literals, destructuring.
- **No single-letter or abbreviated identifiers** — method names, variables, and SCSS aliases must be fully descriptive.
- **No alignment padding** — never pad spaces before `=` to vertically align assignments. Use a single space before `=` always.
- **No signal writes or event emissions in templates** — never call `.set()`, `.update()`, or `.emit()` directly in a template expression. Move all writes into a named component method. Expose field signals as `Signal<T>` (not `WritableSignal<T>`) on the component so the template can only read them.
- **No magic numbers or bare index access** — prefer truthiness checks (`!array.length` over `array.length === 0`) and array destructuring (`const [first] = array`) over index access (`array[0]`).
- **No `(ngSubmit)`** — never handle form submission via `(ngSubmit)`. Bind `(click)="method()"` directly on the submit button using `ButtonType.Button`.

## Naming Conventions (class properties)
- **Static `readonly` properties** (primitives, data arrays, constants) → `CAPITAL_SNAKE_CASE`
- **Reactive properties** (`Signal`, `WritableSignal`, `computed`) → `camelCase`
- **Injected dependencies** (via `inject()`) → `camelCase` private field. No leading underscore, no `$` suffix.
- **Private `WritableSignal` backing a public `Signal<T>`** → prefix with a single underscore: `_name: WritableSignal<T>`. The public surface exposes only a `computed()`.

## Styling — BEM + SCSS
- **BEM** (Block Element Modifier) naming in all stylesheets.
- **No inline styles** unless dynamically computed (e.g. `[style.height]="h()"`)
- Global SCSS partials live in `src/styles/abstract/` and `src/styles/base/`.
- Import global tokens with `@use 'abstract/colors' as colors`, `@use 'abstract/variables' as variables` — **never single-letter aliases**.

## Comments
- Default: **no comments.**
- Only add a comment when the **WHY** is non-obvious: a hidden constraint, a subtle invariant, a workaround for a specific bug.
- Never document WHAT the code does.

## Accessibility
- All interactive elements must be keyboard-navigable.
- No `outline: none` without a custom focus style replacement.
- Must pass all AXE checks and meet WCAG AA minimums.

## i18n (Internationalisation)
- **All static UI text** lives in `src/assets/i18n/en.json`.
- No hard-coded strings in templates or components.
- **JSON keys are `UPPER_SNAKE_CASE`** at every level.
- In facades, use `inject(TranslateService)` + `toSignal(translateService.stream('SECTION'))` to create a `translation: Signal<Record<string, string>>`. Derive individual strings with `computed()`.

## Security
- Sanitize all user input at system boundaries.
- Never store secrets in source code or committed `.env` files.
