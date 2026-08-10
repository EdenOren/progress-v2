import { inject, Service } from '@angular/core';
import * as z from '../../types/zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../platform/supabase.service';
import { mapSupabaseError } from '../../errors/error-mapper';
import { NotFoundError, ValidationError } from '../../errors/app-error';
import { err, ok } from '../../types/result';
import type { Result } from '../../types/result';

const subjectSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  domain_id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

type SubjectRaw = z.infer<typeof subjectSchema>;

const subjectArraySchema = z.array(subjectSchema);

export interface Subject {
  id: string;
  userId: string;
  domainId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapSubject(raw: SubjectRaw): Subject {
  return {
    id: raw.id,
    userId: raw.user_id,
    domainId: raw.domain_id,
    name: raw.name,
    description: raw.description,
    isActive: raw.is_active,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export interface CreateSubjectInput {
  userId: string;
  domainId: string;
  name: string;
  description: string | null;
}

@Service()
export class SubjectsService {
  private readonly supabase: SupabaseClient = inject(SupabaseService).client;

  async getSubjects(userId: string): Promise<Result<Subject[]>> {
    const { data, error } = await this.supabase
      .from('subjects')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) {
      return err(mapSupabaseError(error));
    }
    const validated = subjectArraySchema.safeParse(data);
    if (!validated.success) {
      return err(new ValidationError('Invalid subject data'));
    }
    return ok(validated.data.map(mapSubject));
  }

  async getSubjectById(userId: string, subjectId: string): Promise<Result<Subject>> {
    const { data, error } = await this.supabase
      .from('subjects')
      .select('*')
      .eq('id', subjectId)
      .eq('user_id', userId)
      .single();
    if (error) {
      return err(mapSupabaseError(error));
    }
    if (!data) {
      return err(new NotFoundError('Subject not found'));
    }
    const validated = subjectSchema.safeParse(data);
    if (!validated.success) {
      return err(new ValidationError('Invalid subject data'));
    }
    return ok(mapSubject(validated.data));
  }

  async createSubject(input: CreateSubjectInput): Promise<Result<Subject>> {
    const { data, error } = await this.supabase
      .from('subjects')
      .insert({
        user_id: input.userId,
        domain_id: input.domainId,
        name: input.name,
        description: input.description,
      })
      .select()
      .single();
    if (error) {
      return err(mapSupabaseError(error));
    }
    const validated = subjectSchema.safeParse(data);
    if (!validated.success) {
      return err(new ValidationError('Invalid subject data'));
    }
    return ok(mapSubject(validated.data));
  }

  async deleteSubject(subjectId: string): Promise<Result<void>> {
    const { error } = await this.supabase.from('subjects').delete().eq('id', subjectId);
    if (error) {
      return err(mapSupabaseError(error));
    }
    return ok(undefined);
  }
}
