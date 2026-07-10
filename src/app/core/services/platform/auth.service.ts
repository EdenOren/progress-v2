import { computed, inject, Service, Signal, signal, WritableSignal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { AuthError, InternalError, VerificationRequiredError } from '../../errors/app-error';
import { mapSupabaseAuthError } from '../../errors/error-mapper';
import type { Result } from '../../types/result';
import { err, isOk, ok } from '../../types/result';
import { SupabaseService } from './supabase.service';
import { AppRoute } from '../../enums/app-route.enum';
import { AuthRoute } from '../../enums/auth-route.enum';
import { SupabaseAuthEvent } from '../../enums/supabase-auth-event.enum';
import { LoginStatus } from '../../enums/login-status.enum';
import { DeviceSessionService } from '../data/device-session.service';
import { LoginChallengeService } from '../data/login-challenge.service';

@Service()
export class AuthService {
  private readonly supabase: SupabaseClient = inject(SupabaseService).client;
  private readonly document: Document = inject(DOCUMENT);
  private readonly deviceSessionService: DeviceSessionService = inject(DeviceSessionService);
  private readonly loginChallengeService: LoginChallengeService = inject(LoginChallengeService);
  private readonly _session: WritableSignal<Session | null> = signal(null);
  private readonly _isNewDevice: WritableSignal<boolean> = signal(false);
  private readonly _pendingOtpChallengeId: WritableSignal<string | null> = signal(null);

  readonly session: Signal<Session | null> = computed(() => this._session());
  readonly isAuthenticated: Signal<boolean> = computed(() => this._session() !== null);
  readonly userId: Signal<string> = computed(() => this._session()?.user.id ?? '');
  readonly isNewDevice: Signal<boolean> = computed(() => this._isNewDevice());
  readonly pendingOtpChallengeId: Signal<string | null> = computed(() => this._pendingOtpChallengeId());
  readonly initialized: Promise<void>;

  constructor() {
    this.initialized = this.supabase.auth.getSession().then(({ data }) => {
      this._session.set(data.session);
    });

    this.supabase.auth.onAuthStateChange((event, session) => {
      this._session.set(session);
      if (event === SupabaseAuthEvent.SignedIn) {
        this.recordDeviceSession();
      }
    });
  }

  acknowledgeNewDevice(): void {
    this._isNewDevice.set(false);
  }

  private recordDeviceSession(): void {
    this.deviceSessionService.recordSession().then((result) => {
      if (isOk(result)) {
        this._isNewDevice.set(result.data.isNewDevice);
      } else {
        console.error('Failed to record device session:', result.error);
      }
    });
  }

  async signInWithEmail(email: string, password: string): Promise<Result<{ status: LoginStatus }>> {
    const result = await this.loginChallengeService.signIn(email, password);
    if (!result.success) {
      return err(result.error);
    }
    if (!result.data.requiresOtp) {
      return this.applySessionTokens(result.data.accessToken, result.data.refreshToken, LoginStatus.Success);
    }
    this._pendingOtpChallengeId.set(result.data.challengeId);
    return ok({ status: LoginStatus.OtpRequired });
  }

  async verifyDeviceOtp(code: string): Promise<Result<void>> {
    const challengeId: string | null = this._pendingOtpChallengeId();
    if (!challengeId) {
      return err(new InternalError('No pending device verification'));
    }
    const result = await this.loginChallengeService.verifyOtp(challengeId, code);
    if (!result.success) {
      return err(result.error);
    }
    const sessionResult = await this.applySessionTokens(result.data.accessToken, result.data.refreshToken, LoginStatus.Success);
    if (!sessionResult.success) {
      return err(sessionResult.error);
    }
    this._pendingOtpChallengeId.set(null);
    return ok(undefined);
  }

  async resendDeviceOtp(): Promise<Result<void>> {
    const challengeId: string | null = this._pendingOtpChallengeId();
    if (!challengeId) {
      return err(new InternalError('No pending device verification'));
    }
    return this.loginChallengeService.resendOtp(challengeId);
  }

  private async applySessionTokens(
    accessToken: string,
    refreshToken: string,
    status: LoginStatus,
  ): Promise<Result<{ status: LoginStatus }>> {
    const { error } = await this.supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      return err(mapSupabaseAuthError(error.message));
    }
    return ok({ status });
  }

  async signUpWithEmail(email: string, password: string, displayName: string): Promise<Result<Session>> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) {
      return err(mapSupabaseAuthError(error.message));
    }
    if (!data.session) {
      return err(new VerificationRequiredError('Verify your email to complete sign up'));
    }
    return ok(data.session);
  }

  async signInWithGoogle(): Promise<Result<void>> {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${this.document.location.origin}/auth/callback` },
    });
    if (error) {
      return err(mapSupabaseAuthError(error.message));
    }
    return ok(undefined);
  }

  async signOut(): Promise<Result<void>> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      return err(mapSupabaseAuthError(error.message));
    }
    return ok(undefined);
  }

  async resetPasswordForEmail(email: string): Promise<Result<void>> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${this.document.location.origin}/${AppRoute.Auth}/${AuthRoute.ResetPassword}`,
    });
    if (error) {
      return err(mapSupabaseAuthError(error.message));
    }
    return ok(undefined);
  }

  async updateUserPassword(password: string): Promise<Result<void>> {
    const { error } = await this.supabase.auth.updateUser({ password });
    if (error) {
      return err(mapSupabaseAuthError(error.message));
    }
    return ok(undefined);
  }
}
