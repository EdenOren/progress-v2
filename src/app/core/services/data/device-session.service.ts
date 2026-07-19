import { inject, Service } from '@angular/core';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../platform/supabase.service';
import { NetworkError, ValidationError } from '../../errors/app-error';
import { err, ok } from '../../types/result';
import type { Result } from '../../types/result';

const deviceSessionResultSchema: z.ZodType<DeviceSessionResult> = z.object({
  isNewDevice: z.boolean(),
  alertEmailSent: z.boolean().optional(),
});

export interface DeviceSessionResult {
  isNewDevice: boolean;
  alertEmailSent?: boolean;
}

@Service()
export class DeviceSessionService {
  private readonly supabase: SupabaseClient = inject(SupabaseService).client;

  async recordSession(): Promise<Result<DeviceSessionResult>> {
    const { data, error } = await this.supabase.functions.invoke('record-device-session');
    if (error) {
      return err(new NetworkError(error.message));
    }
    const validated = deviceSessionResultSchema.safeParse(data);
    if (!validated.success) {
      return err(new ValidationError('Invalid device session response'));
    }
    return ok(validated.data);
  }
}
