import { inject, Service } from '@angular/core';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../platform/supabase.service';
import { mapSupabaseError } from '../../errors/error-mapper';
import { ValidationError } from '../../errors/app-error';
import { err, ok } from '../../types/result';
import type { Result } from '../../types/result';

interface EntryRaw {
  id: string;
  user_id: string;
  subject_id: string;
  performed_at: string;
  notes: string | null;
  is_completed: boolean;
  duration_seconds: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

const entrySchema: z.ZodType<EntryRaw> = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  performed_at: z.string(),
  notes: z.string().nullable(),
  is_completed: z.boolean(),
  duration_seconds: z.number().nullable(),
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const entryArraySchema: z.ZodType<EntryRaw[]> = z.array(entrySchema);

export interface Entry {
  id: string;
  userId: string;
  subjectId: string;
  performedAt: string;
  notes: string | null;
  isCompleted: boolean;
  durationSeconds: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapEntry(raw: EntryRaw): Entry {
  return {
    id: raw.id,
    userId: raw.user_id,
    subjectId: raw.subject_id,
    performedAt: raw.performed_at,
    notes: raw.notes,
    isCompleted: raw.is_completed,
    durationSeconds: raw.duration_seconds,
    startedAt: raw.started_at,
    completedAt: raw.completed_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export interface CreateEntryInput {
  userId: string;
  subjectId: string;
  performedAt: string;
}

export interface CompleteEntryInput {
  entryId: string;
  durationSeconds: number;
  notes: string | null;
}

@Service()
export class EntriesService {
  private readonly supabase: SupabaseClient = inject(SupabaseService).client;

  async getEntries(userId: string, subjectId: string): Promise<Result<Entry[]>> {
    const { data, error } = await this.supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId)
      .eq('subject_id', subjectId)
      .order('performed_at', { ascending: false });
    if (error) {
      return err(mapSupabaseError(error));
    }
    const validated = entryArraySchema.safeParse(data);
    if (!validated.success) {
      return err(new ValidationError('Invalid entry data'));
    }
    return ok(validated.data.map(mapEntry));
  }

  async getEntry(entryId: string, userId: string): Promise<Result<Entry>> {
    const { data, error } = await this.supabase
      .from('entries')
      .select('*')
      .eq('id', entryId)
      .eq('user_id', userId)
      .single();
    if (error) {
      return err(mapSupabaseError(error));
    }
    const validated = entrySchema.safeParse(data);
    if (!validated.success) {
      return err(new ValidationError('Invalid entry data'));
    }
    return ok(mapEntry(validated.data));
  }

  async createEntry(input: CreateEntryInput): Promise<Result<Entry>> {
    const { data, error } = await this.supabase
      .from('entries')
      .insert({
        user_id: input.userId,
        subject_id: input.subjectId,
        performed_at: input.performedAt,
        is_completed: false,
      })
      .select()
      .single();
    if (error) {
      return err(mapSupabaseError(error));
    }
    const validated = entrySchema.safeParse(data);
    if (!validated.success) {
      return err(new ValidationError('Invalid entry data'));
    }
    return ok(mapEntry(validated.data));
  }

  async startEntry(entryId: string): Promise<Result<void>> {
    const { error } = await this.supabase
      .from('entries')
      .update({ started_at: new Date().toISOString() })
      .eq('id', entryId)
      .is('started_at', null);
    if (error) {
      return err(mapSupabaseError(error));
    }
    return ok(undefined);
  }

  async completeEntry(input: CompleteEntryInput): Promise<Result<void>> {
    const { error } = await this.supabase
      .from('entries')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        duration_seconds: input.durationSeconds,
        notes: input.notes,
      })
      .eq('id', input.entryId);
    if (error) {
      return err(mapSupabaseError(error));
    }
    return ok(undefined);
  }

  async getLastCompletedEntry(
    subjectId: string,
    userId: string,
    excludeEntryId?: string,
  ): Promise<Result<Entry | null>> {
    let query = this.supabase
      .from('entries')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('user_id', userId)
      .eq('is_completed', true)
      .order('performed_at', { ascending: false })
      .limit(1);
    if (excludeEntryId) {
      query = query.neq('id', excludeEntryId);
    }
    const { data, error } = await query;
    if (error) {
      return err(mapSupabaseError(error));
    }
    if (!data || !data.length) {
      return ok(null);
    }
    const [first] = data;
    const validated = entrySchema.safeParse(first);
    if (!validated.success) {
      return err(new ValidationError('Invalid entry data'));
    }
    return ok(mapEntry(validated.data));
  }
}
