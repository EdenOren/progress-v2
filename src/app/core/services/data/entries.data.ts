import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
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

export async function getEntries(
  supabase: SupabaseClient,
  userId: string,
  subjectId: string,
): Promise<Result<Entry[]>> {
  const { data, error } = await supabase
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
