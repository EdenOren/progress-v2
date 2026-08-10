import { inject, Service } from '@angular/core';
import * as z from '../../types/zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../platform/supabase.service';
import { AuthError, NetworkError, ValidationError } from '../../errors/app-error';
import { err, ok } from '../../types/result';
import type { Result } from '../../types/result';
import { resolveEdgeFunctionErrorMessage } from './edge-function-error.util';

const loginWithDeviceCheckResultSchema: z.ZodType<LoginWithDeviceCheckResult> = z.union([
  z.object({ requiresOtp: z.literal(false), accessToken: z.string(), refreshToken: z.string() }),
  z.object({ requiresOtp: z.literal(true), challengeId: z.string() }),
]);

const verifyDeviceOtpResultSchema: z.ZodType<VerifyDeviceOtpResult> = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type LoginWithDeviceCheckResult =
  | { requiresOtp: false; accessToken: string; refreshToken: string }
  | { requiresOtp: true; challengeId: string };

export interface VerifyDeviceOtpResult {
  accessToken: string;
  refreshToken: string;
}

@Service()
export class LoginChallengeService {
  private readonly supabase: SupabaseClient = inject(SupabaseService).client;

  async signIn(email: string, password: string): Promise<Result<LoginWithDeviceCheckResult>> {
    const { data, error } = await this.supabase.functions.invoke('login-with-device-check', {
      body: { email, password },
    });
    if (error) {
      return err(new AuthError(await resolveEdgeFunctionErrorMessage(error, 'Unable to sign in')));
    }
    const validated = loginWithDeviceCheckResultSchema.safeParse(data);
    if (!validated.success) {
      return err(new ValidationError('Invalid login response'));
    }
    return ok(validated.data);
  }

  async verifyOtp(challengeId: string, code: string): Promise<Result<VerifyDeviceOtpResult>> {
    const { data, error } = await this.supabase.functions.invoke('verify-device-otp', {
      body: { challengeId, code },
    });
    if (error) {
      return err(new AuthError(await resolveEdgeFunctionErrorMessage(error, 'Unable to verify code')));
    }
    const validated = verifyDeviceOtpResultSchema.safeParse(data);
    if (!validated.success) {
      return err(new ValidationError('Invalid verification response'));
    }
    return ok(validated.data);
  }

  async resendOtp(challengeId: string): Promise<Result<void>> {
    const { error } = await this.supabase.functions.invoke('resend-device-otp', {
      body: { challengeId },
    });
    if (error) {
      return err(new NetworkError(await resolveEdgeFunctionErrorMessage(error, 'Unable to resend code')));
    }
    return ok(undefined);
  }
}
