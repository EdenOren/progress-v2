# Supabase Integration

> Read when working on data services or migrations.

The Supabase JS client is **not** Angular's HttpClient. These rules override the general HTTP patterns:

- `SupabaseService` in `core/services/platform/supabase.service.ts` — singleton providing the `SupabaseClient`.
- Data services use **`resource()`** (NOT `httpResource()`) — Supabase returns Promises, not HTTP observables.
- **`BaseDataService` does NOT apply** — Supabase services define their own `resource()`.
- All Supabase calls return **`Result<T, AppError>`** — never throw, never expose raw errors.
- Validate all Supabase responses with **Zod** before returning.
- After mutations, call `.reload()` on the relevant `resource()` to re-sync.

## Result Type

Located at `src/app/core/types/result.ts`:
```ts
export type Result<T, E extends AppError = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };
```
Helpers: `ok()`, `err()`, `isOk()`, `isErr()`.

## API Function Pattern

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

## Database Migration Rules
ALL migrations must be backwards compatible — no column drops, no data loss.
New migrations use sequential numbering starting at 012.
