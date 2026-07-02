# Phase DR-1 — Design Tokens

**Branch:** `refactor/design-tokens`
**Target:** `development`

---

## Goal

Extend the existing design-token foundation so every later Design Refresh branch (DR-2 through DR-9) has the primitives it needs: a heading type scale, elevation semantics, and a touch-target minimum. Purely additive — no existing consumer changes, no visual change to any currently-rendered screen.

---

## Files to Create / Modify

| File | Action |
|------|--------|
| `src/styles/base/_typography.scss` | Modify — add `--leading-tight`/`--leading-snug` custom properties, add `h1`–`h4` element rules |
| `src/styles/abstract/_variables.scss` | Modify — add `$touch-target-min`, `$dialog-max-width`, `$container-max-width`, `$card-grid-min` |
| `src/styles/abstract/_elevation.scss` | Create — semantic elevation tokens wrapping existing `$shadow-*` |
| `src/styles/abstract/_mixins.scss` | Modify — add `touch-target` mixin |

### `_typography.scss`

Add to the `:root` block:
```scss
--leading-tight: 1.2;
--leading-snug: 1.3;
```

Add after the `body` rule:
```scss
h1 {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  margin: 0 0 variables.$spacing-sm;
}

h2 {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  margin: 0 0 variables.$spacing-sm;
}

h3 {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
  margin: 0 0 variables.$spacing-sm;
}

h4 {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
  margin: 0 0 variables.$spacing-sm;
}
```
Requires adding `@use 'abstract/variables' as variables;` to the top of the file (not currently imported there).

### `_variables.scss`

Append:
```scss
$touch-target-min: 44px;

$dialog-max-width: 400px;
$container-max-width: 1200px;
$card-grid-min: 280px;
```

### `_elevation.scss` (new)

```scss
@use 'variables' as variables;

$elevation-card: variables.$shadow-sm;
$elevation-card-hover: variables.$shadow-md;
$elevation-modal: variables.$shadow-lg;
```

### `_mixins.scss`

Append:
```scss
@mixin touch-target {
  min-width: variables.$touch-target-min;
  min-height: variables.$touch-target-min;
}
```

---

## Acceptance Criteria

- `h1`–`h4` render with distinct, deliberate sizes/weights when used (no consumer yet, but verifiable by temporarily adding a heading tag or via a quick manual check).
- `$touch-target-min`, `$elevation-*`, `$dialog-max-width`, `$container-max-width`, `$card-grid-min`, and the `touch-target` mixin are all importable from other SCSS partials.
- `ng build` succeeds with no visual regression on any existing screen (nothing consumes the new tokens yet).

## Verification

1. `ng build` — must succeed unchanged.
2. `ng serve` — spot-check that no existing page visually changed (these tokens are additive/unused until DR-2+).
