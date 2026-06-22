import { inject, Service } from '@angular/core';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../platform/supabase.service';
import { mapSupabaseError } from '../../errors/error-mapper';
import { ValidationError } from '../../errors/app-error';
import { err, ok } from '../../types/result';
import type { Result } from '../../types/result';
import { DistanceUnit } from '../../../shared/enums/distance-unit.enum';

const workoutSettingsSchema = z.object({
  distance_unit: z.nativeEnum(DistanceUnit).optional(),
  weight_unit: z.string().optional(),
});

const userSettingsSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  module_settings: z.object({
    workout: workoutSettingsSchema.optional(),
  }).nullable(),
});

type UserSettingsRaw = z.infer<typeof userSettingsSchema>;

export interface WorkoutSettings {
  distanceUnit: DistanceUnit;
  weightUnit: string;
}

function mapWorkoutSettings(raw: UserSettingsRaw): WorkoutSettings {
  const workout = raw.module_settings?.workout;
  return {
    distanceUnit: workout?.distance_unit ?? DistanceUnit.Km,
    weightUnit: workout?.weight_unit ?? 'kg',
  };
}

@Service()
export class UserSettingsService {
  private readonly supabase: SupabaseClient = inject(SupabaseService).client;

  async getWorkoutSettings(userId: string): Promise<Result<WorkoutSettings>> {
    const { data, error } = await this.supabase
      .from('user_settings')
      .select('id, user_id, module_settings')
      .eq('user_id', userId)
      .single();
    if (error) {
      return err(mapSupabaseError(error));
    }
    const validated = userSettingsSchema.safeParse(data);
    if (!validated.success) {
      return err(new ValidationError('Invalid user settings data'));
    }
    return ok(mapWorkoutSettings(validated.data));
  }
}
