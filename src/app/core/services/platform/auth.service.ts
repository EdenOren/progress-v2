import { computed, inject, Service, Signal, signal, WritableSignal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { AuthError, InternalError, VerificationRequiredError } from '../../errors/app-error';
import { mapSupabaseAuthError } from '../../errors/error-mapper';
import type { Result } from '../../types/result';
import { err, ok } from '../../types/result';
import { SupabaseService } from './supabase.service';

@Service()
export class AuthService {
  private readonly supabase: SupabaseClient = inject(SupabaseService).client;
  private readonly document: Document = inject(DOCUMENT);
  private readonly _session: WritableSignal<Session | null> = signal(null);

  readonly session: Signal<Session | null> = computed(() => this._session());
  readonly isAuthenticated: Signal<boolean> = computed(() => this._session() !== null);
  readonly userId: Signal<string> = computed(() => this._session()?.user.id ?? '');
  readonly initialized: Promise<void>;

  constructor() {
    this.initialized = this.supabase.auth.getSession().then(({ data }) => {
      this._session.set(data.session);
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this._session.set(session);
    });
  }

  async signInWithEmail(email: string, password: string): Promise<Result<Session>> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return err(mapSupabaseAuthError(error.message));
    }
    if (!data.session) {
      return err(new InternalError('No session returned after sign in'));
    }
    return ok(data.session);
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
}
