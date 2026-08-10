/**
 * Zod's entry point re-exports its locale bundles as a namespace, and
 * `import { z } from 'zod'` pulls that namespace in whole — 53 locale files,
 * 195 kB of validation-error translations this app never shows, because
 * Supabase errors are mapped through `error-messages.const.ts` instead. The
 * same barrel drags in the JSON-schema converters and the coercion helpers.
 *
 * Naming only the exports actually used lets the bundler drop the rest. Import
 * this as `import * as z from '<path>/core/types/zod'`, so call sites keep
 * reading `z.object(...)` exactly as before.
 */
export { array, boolean, literal, nativeEnum, number, object, string, union } from 'zod';
export type { infer, ZodSafeParseResult, ZodType } from 'zod';
