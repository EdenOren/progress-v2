import { inject, Service } from '@angular/core';
import * as z from '../../types/zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../platform/supabase.service';
import { mapSupabaseError } from '../../errors/error-mapper';
import { ValidationError } from '../../errors/app-error';
import { err, ok } from '../../types/result';
import type { Result } from '../../types/result';
import { DistanceUnit } from '../../../shared/enums/distance-unit.enum';
import { WeightUnit } from '../../../shared/enums/weight-unit.enum';

const workoutSettingsSchema = z.object({
  distance_unit: z.nativeEnum(DistanceUnit).optional(),
  weight_unit: z.nativeEnum(WeightUnit).optional(),
});

const userSettingsSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  module_settings: z.object({
    workout: workoutSettingsSchema.optional(),
  }).nullable(),
});

type UserSettingsRaw = z.infer<typeof userSettingsSchema>;

export interface WorkoutSettings {
  distanceUnit: DistanceUnit;
  weightUnit: WeightUnit;
}

export interface UpdateWorkoutSettingsInput {
  distanceUnit?: DistanceUnit;
  weightUnit?: WeightUnit;
}

function mapWorkoutSettings(raw: UserSettingsRaw): WorkoutSettings {
  const workout = raw.module_settings?.workout;
  return {
    distanceUnit: workout?.distance_unit ?? DistanceUnit.Km,
    weightUnit: workout?.weight_unit ?? WeightUnit.Kg,
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

  async updateWorkoutSettings(
    userId: string,
    input: UpdateWorkoutSettingsInput,
  ): Promise<Result<WorkoutSettings>> {
    const { data: existing, error: fetchError } = await this.supabase
      .from('user_settings')
      .select('module_settings')
      .eq('user_id', userId)
      .single();
    if (fetchError) {
      return err(mapSupabaseError(fetchError));
    }

    const currentModuleSettings: Record<string, unknown> =
      (existing.module_settings as Record<string, unknown> | null) ?? {};
    const currentWorkout: Record<string, unknown> =
      (currentModuleSettings['workout'] as Record<string, unknown> | undefined) ?? {};

    const updatedModuleSettings: Record<string, unknown> = {
      ...currentModuleSettings,
      workout: {
        ...currentWorkout,
        ...(input.distanceUnit !== undefined && { distance_unit: input.distanceUnit }),
        ...(input.weightUnit !== undefined && { weight_unit: input.weightUnit }),
      },
    };

    const { data, error } = await this.supabase
      .from('user_settings')
      .update({ module_settings: updatedModuleSettings })
      .eq('user_id', userId)
      .select('id, user_id, module_settings')
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
