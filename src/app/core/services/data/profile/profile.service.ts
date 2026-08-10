import { inject, Service } from '@angular/core';
import * as z from '../../../types/zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../platform/supabase.service';
import { mapSupabaseError } from '../../../errors/error-mapper';
import { ValidationError } from '../../../errors/app-error';
import { err, ok } from '../../../types/result';
import type { Result } from '../../../types/result';
import type { Profile, ProfileRaw, UpdateProfileInput } from './profile.model';

const profileSchema: z.ZodType<ProfileRaw> = z.object({
  id: z.string(),
  display_name: z.string(),
  avatar_url: z.string().nullable(),
  height_cm: z.number().nullable(),
  weight_kg: z.number().nullable(),
  date_of_birth: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

function mapProfile(raw: ProfileRaw): Profile {
  return {
    id: raw.id,
    displayName: raw.display_name,
    avatarUrl: raw.avatar_url,
    heightCm: raw.height_cm,
    weightKg: raw.weight_kg,
    dateOfBirth: raw.date_of_birth,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

@Service()
export class ProfileService {
  private readonly supabase: SupabaseClient = inject(SupabaseService).client;

  async getProfile(userId: string): Promise<Result<Profile>> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      return err(mapSupabaseError(error));
    }
    const validated = profileSchema.safeParse(data);
    if (!validated.success) {
      return err(new ValidationError('Invalid profile data'));
    }
    return ok(mapProfile(validated.data));
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<Result<void>> {
    const { error } = await this.supabase
      .from('profiles')
      .update({
        display_name: input.displayName,
        date_of_birth: input.dateOfBirth,
        height_cm: input.heightCm,
      })
      .eq('id', userId);
    if (error) {
      return err(mapSupabaseError(error));
    }
    return ok(undefined);
  }
}
