import { inject, Service } from '@angular/core';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../platform/supabase.service';
import { mapSupabaseError } from '../../errors/error-mapper';
import { ValidationError } from '../../errors/app-error';
import { err, ok } from '../../types/result';
import type { Result } from '../../types/result';

const dailyLogSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  logged_date: z.string(),
  sleep_hours: z.number().nullable(),
  weight_kg: z.number().nullable(),
  water_intake_liters: z.number().nullable(),
  waist_cm: z.number().nullable(),
});

type DailyLogRaw = z.infer<typeof dailyLogSchema>;

const dailyLogArraySchema = z.array(dailyLogSchema);

export interface DailyLog {
  id: string;
  userId: string;
  loggedDate: string;
  sleepHours: number | null;
  weightKg: number | null;
  waterLiters: number | null;
  waistCm: number | null;
}

export interface UpsertDailyLogInput {
  userId: string;
  loggedDate: string;
  sleepHours: number | null;
  weightKg: number | null;
  waterLiters: number | null;
  waistCm: number | null;
}

function mapDailyLog(raw: DailyLogRaw): DailyLog {
  return {
    id: raw.id,
    userId: raw.user_id,
    loggedDate: raw.logged_date,
    sleepHours: raw.sleep_hours,
    weightKg: raw.weight_kg,
    waterLiters: raw.water_intake_liters,
    waistCm: raw.waist_cm,
  };
}

@Service()
export class DailyLogsService {
  private readonly supabase: SupabaseClient = inject(SupabaseService).client;

  async getDailyLogsForRange(userId: string, from: string, to: string): Promise<Result<DailyLog[]>> {
    const { data, error } = await this.supabase
      .from('daily_log_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_date', from)
      .lte('logged_date', to)
      .order('logged_date', { ascending: false });
    if (error) {
      return err(mapSupabaseError(error));
    }
    const validated = dailyLogArraySchema.safeParse(data);
    if (!validated.success) {
      return err(new ValidationError('Invalid daily log data'));
    }
    return ok(validated.data.map(mapDailyLog));
  }

  async upsertDailyLog(input: UpsertDailyLogInput): Promise<Result<DailyLog>> {
    const { data, error } = await this.supabase
      .from('daily_log_entries')
      .upsert(
        {
          user_id: input.userId,
          logged_date: input.loggedDate,
          sleep_hours: input.sleepHours,
          weight_kg: input.weightKg,
          water_intake_liters: input.waterLiters,
          waist_cm: input.waistCm,
        },
        { onConflict: 'user_id,logged_date' },
      )
      .select()
      .single();
    if (error) {
      return err(mapSupabaseError(error));
    }
    const validated = dailyLogSchema.safeParse(data);
    if (!validated.success) {
      return err(new ValidationError('Invalid daily log data'));
    }
    return ok(mapDailyLog(validated.data));
  }
}
