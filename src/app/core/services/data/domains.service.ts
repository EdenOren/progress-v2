import { inject, Service } from '@angular/core';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../platform/supabase.service';
import { mapSupabaseError } from '../../errors/error-mapper';
import { ValidationError } from '../../errors/app-error';
import { err, ok } from '../../types/result';
import type { Result } from '../../types/result';

const domainIdSchema: z.ZodType<{ id: string }> = z.object({ id: z.string().uuid() });

@Service()
export class DomainsService {
  private readonly supabase: SupabaseClient = inject(SupabaseService).client;

  async getWorkoutDomainId(): Promise<Result<string>> {
    const { data, error } = await this.supabase
      .from('domains')
      .select('id')
      .eq('key', 'workout')
      .single();
    if (error) {
      return err(mapSupabaseError(error));
    }
    const validated = domainIdSchema.safeParse(data);
    if (!validated.success) {
      return err(new ValidationError('Invalid domain data'));
    }
    return ok(validated.data.id);
  }
}
