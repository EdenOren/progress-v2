import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { mapSupabaseError } from '../../errors/error-mapper';
import { ValidationError } from '../../errors/app-error';
import { err, ok } from '../../types/result';
import type { Result } from '../../types/result';

const domainIdSchema: z.ZodType<{ id: string }> = z.object({ id: z.string().uuid() });

export async function getWorkoutDomainId(supabase: SupabaseClient): Promise<Result<string>> {
  const { data, error } = await supabase.from('domains').select('id').eq('key', 'workout').single();
  if (error) {
    return err(mapSupabaseError(error));
  }
  const validated = domainIdSchema.safeParse(data);
  if (!validated.success) {
    return err(new ValidationError('Invalid domain data'));
  }
  return ok(validated.data.id);
}
