import { FunctionsHttpError } from '@supabase/supabase-js';

export async function resolveEdgeFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (!(error instanceof FunctionsHttpError)) {
    return fallback;
  }
  try {
    const body: unknown = await error.context.json();
    if (body && typeof body === 'object' && 'error' in body && typeof (body as { error: unknown }).error === 'string') {
      return (body as { error: string }).error;
    }
  } catch {
    return fallback;
  }
  return fallback;
}
