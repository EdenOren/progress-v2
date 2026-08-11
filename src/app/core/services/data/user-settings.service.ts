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
import { LogMetricKey } from '../../../shared/enums/log-metric-key.enum';

const workoutSettingsSchema = z.object({
  distance_unit: z.nativeEnum(DistanceUnit).optional(),
  weight_unit: z.nativeEnum(WeightUnit).optional(),
});

// Validated as plain strings rather than the enum on purpose: an unrecognised key
// left behind by a renamed or retired metric would otherwise fail the parse of the
// whole settings row, taking out both the Settings screen and Daily Log's unit
// conversion. Unknown keys are dropped when mapping instead.
const dailyLogSettingsSchema = z.object({
  hidden_metrics: z.array(z.string()).optional(),
});

const userSettingsSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  module_settings: z.object({
    workout: workoutSettingsSchema.optional(),
    daily_log: dailyLogSettingsSchema.optional(),
  }).nullable(),
});

type UserSettingsRaw = z.infer<typeof userSettingsSchema>;

export interface WorkoutSettings {
  distanceUnit: DistanceUnit;
  weightUnit: WeightUnit;
}

export interface DailyLogSettings {
  hiddenMetrics: LogMetricKey[];
}

export interface ModuleSettings {
  workout: WorkoutSettings;
  dailyLog: DailyLogSettings;
}

export interface UpdateWorkoutSettingsInput {
  distanceUnit?: DistanceUnit;
  weightUnit?: WeightUnit;
}

export interface UpdateDailyLogSettingsInput {
  hiddenMetrics: LogMetricKey[];
}

const LOG_METRIC_KEYS: readonly string[] = Object.values(LogMetricKey);

function isLogMetricKey(value: string): value is LogMetricKey {
  return LOG_METRIC_KEYS.includes(value);
}

function mapWorkoutSettings(raw: UserSettingsRaw): WorkoutSettings {
  const workout = raw.module_settings?.workout;
  return {
    distanceUnit: workout?.distance_unit ?? DistanceUnit.Km,
    weightUnit: workout?.weight_unit ?? WeightUnit.Kg,
  };
}

// Absent means nothing hidden, so rows written before column visibility existed
// keep every column without a backfill, and any metric added later starts visible.
function mapDailyLogSettings(raw: UserSettingsRaw): DailyLogSettings {
  const hiddenMetrics: string[] = raw.module_settings?.daily_log?.hidden_metrics ?? [];
  return { hiddenMetrics: hiddenMetrics.filter(isLogMetricKey) };
}

function validateUserSettings(data: unknown): Result<UserSettingsRaw> {
  const validated = userSettingsSchema.safeParse(data);
  if (!validated.success) {
    return err(new ValidationError('Invalid user settings data'));
  }
  return ok(validated.data);
}

function mapModuleSettings(raw: UserSettingsRaw): ModuleSettings {
  return {
    workout: mapWorkoutSettings(raw),
    dailyLog: mapDailyLogSettings(raw),
  };
}

@Service()
export class UserSettingsService {
  private readonly supabase: SupabaseClient = inject(SupabaseService).client;

  async getWorkoutSettings(userId: string): Promise<Result<WorkoutSettings>> {
    const result: Result<UserSettingsRaw> = await this.fetchUserSettings(userId);
    if (!result.success) {
      return err(result.error);
    }
    return ok(mapWorkoutSettings(result.data));
  }

  async getModuleSettings(userId: string): Promise<Result<ModuleSettings>> {
    const result: Result<UserSettingsRaw> = await this.fetchUserSettings(userId);
    if (!result.success) {
      return err(result.error);
    }
    return ok(mapModuleSettings(result.data));
  }

  async updateWorkoutSettings(
    userId: string,
    input: UpdateWorkoutSettingsInput,
  ): Promise<Result<WorkoutSettings>> {
    const result: Result<UserSettingsRaw> = await this.writeModuleSettings(
      userId,
      (current: Record<string, unknown>) => {
        const currentWorkout: Record<string, unknown> =
          (current['workout'] as Record<string, unknown> | undefined) ?? {};
        return {
          ...current,
          workout: {
            ...currentWorkout,
            ...(input.distanceUnit !== undefined && { distance_unit: input.distanceUnit }),
            ...(input.weightUnit !== undefined && { weight_unit: input.weightUnit }),
          },
        };
      },
    );
    if (!result.success) {
      return err(result.error);
    }
    return ok(mapWorkoutSettings(result.data));
  }

  async updateDailyLogSettings(
    userId: string,
    input: UpdateDailyLogSettingsInput,
  ): Promise<Result<ModuleSettings>> {
    const result: Result<UserSettingsRaw> = await this.writeModuleSettings(
      userId,
      (current: Record<string, unknown>) => {
        const currentDailyLog: Record<string, unknown> =
          (current['daily_log'] as Record<string, unknown> | undefined) ?? {};
        return {
          ...current,
          daily_log: { ...currentDailyLog, hidden_metrics: input.hiddenMetrics },
        };
      },
    );
    if (!result.success) {
      return err(result.error);
    }
    return ok(mapModuleSettings(result.data));
  }

  private async fetchUserSettings(userId: string): Promise<Result<UserSettingsRaw>> {
    const { data, error } = await this.supabase
      .from('user_settings')
      .select('id, user_id, module_settings')
      .eq('user_id', userId)
      .single();
    if (error) {
      return err(mapSupabaseError(error));
    }
    return validateUserSettings(data);
  }

  private async writeModuleSettings(
    userId: string,
    buildModuleSettings: (current: Record<string, unknown>) => Record<string, unknown>,
  ): Promise<Result<UserSettingsRaw>> {
    // Merged from the raw row rather than a validated one: Zod strips keys it has no
    // schema for, so writing back a parsed object would silently delete any other
    // module's settings block.
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

    const { data, error } = await this.supabase
      .from('user_settings')
      .update({ module_settings: buildModuleSettings(currentModuleSettings) })
      .eq('user_id', userId)
      .select('id, user_id, module_settings')
      .single();
    if (error) {
      return err(mapSupabaseError(error));
    }
    return validateUserSettings(data);
  }
}
