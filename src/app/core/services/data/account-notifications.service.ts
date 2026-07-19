import { inject, Service } from '@angular/core';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../platform/supabase.service';
import { NetworkError, ValidationError } from '../../errors/app-error';
import { err, ok } from '../../types/result';
import type { Result } from '../../types/result';
import { resolveEdgeFunctionErrorMessage } from './edge-function-error.util';

const notifyPasswordChangedResultSchema: z.ZodType<NotifyPasswordChangedResult> = z.object({
  ok: z.boolean(),
});

export interface NotifyPasswordChangedResult {
  ok: boolean;
}

@Service()
export class AccountNotificationsService {
  private readonly supabase: SupabaseClient = inject(SupabaseService).client;

  async notifyPasswordChanged(): Promise<Result<void>> {
    const { data, error } = await this.supabase.functions.invoke('notify-password-changed');
    if (error) {
      return err(new NetworkError(await resolveEdgeFunctionErrorMessage(error, 'Unable to send password-changed notification')));
    }
    const validated = notifyPasswordChangedResultSchema.safeParse(data);
    if (!validated.success) {
      return err(new ValidationError('Invalid notification response'));
    }
    if (!validated.data.ok) {
      return err(new NetworkError('Notification email failed to send'));
    }
    return ok(undefined);
  }
}
