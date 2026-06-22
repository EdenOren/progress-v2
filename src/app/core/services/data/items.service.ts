import { inject, Service } from '@angular/core';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../platform/supabase.service';
import { mapSupabaseError } from '../../errors/error-mapper';
import { ValidationError } from '../../errors/app-error';
import { err, ok } from '../../types/result';
import type { Result } from '../../types/result';
import { TrackingType } from '../../../shared/enums/tracking-type.enum';
import { FeedbackRating } from '../../../shared/enums/feedback-rating.enum';

const itemSetSchema = z.object({
  id: z.string().uuid(),
  item_id: z.string().uuid(),
  user_id: z.string().uuid(),
  set_index: z.number(),
  weight_kg: z.number().nullable(),
  reps: z.number().nullable(),
  duration_sec: z.number().nullable(),
  distance_m: z.number().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
});

const itemFeedbackSchema = z.object({
  id: z.string().uuid(),
  item_id: z.string().uuid(),
  user_id: z.string().uuid(),
  rating: z.nativeEnum(FeedbackRating),
  comment: z.string().nullable(),
  created_at: z.string(),
});

const sessionItemSchema = z.object({
  id: z.string().uuid(),
  entry_id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  position: z.number(),
  tracking_type: z.nativeEnum(TrackingType),
  note: z.string().nullable(),
  created_at: z.string(),
  item_sets: z.array(itemSetSchema),
  item_feedback: z.array(itemFeedbackSchema),
});

const sessionItemArraySchema = z.array(sessionItemSchema);

type SessionItemRaw = z.infer<typeof sessionItemSchema>;
type ItemSetRaw = z.infer<typeof itemSetSchema>;
type ItemFeedbackRaw = z.infer<typeof itemFeedbackSchema>;

export interface ItemSet {
  id: string;
  itemId: string;
  userId: string;
  setIndex: number;
  weightKg: number | null;
  reps: number | null;
  durationSec: number | null;
  distanceM: number | null;
  notes: string | null;
  createdAt: string;
}

export interface ItemFeedback {
  id: string;
  itemId: string;
  userId: string;
  rating: FeedbackRating;
  comment: string | null;
  createdAt: string;
}

export interface SessionItem {
  id: string;
  entryId: string;
  userId: string;
  name: string;
  position: number;
  trackingType: TrackingType;
  note: string | null;
  createdAt: string;
  sets: ItemSet[];
  feedback: ItemFeedback | null;
}

function mapItemSet(raw: ItemSetRaw): ItemSet {
  return {
    id: raw.id,
    itemId: raw.item_id,
    userId: raw.user_id,
    setIndex: raw.set_index,
    weightKg: raw.weight_kg,
    reps: raw.reps,
    durationSec: raw.duration_sec,
    distanceM: raw.distance_m,
    notes: raw.notes,
    createdAt: raw.created_at,
  };
}

function mapItemFeedback(raw: ItemFeedbackRaw): ItemFeedback {
  return {
    id: raw.id,
    itemId: raw.item_id,
    userId: raw.user_id,
    rating: raw.rating,
    comment: raw.comment,
    createdAt: raw.created_at,
  };
}

function mapSessionItem(raw: SessionItemRaw): SessionItem {
  const sortedSets = [...raw.item_sets].sort((first, second) => first.set_index - second.set_index);
  const [feedbackRaw] = raw.item_feedback;
  return {
    id: raw.id,
    entryId: raw.entry_id,
    userId: raw.user_id,
    name: raw.name,
    position: raw.position,
    trackingType: raw.tracking_type,
    note: raw.note,
    createdAt: raw.created_at,
    sets: sortedSets.map(mapItemSet),
    feedback: feedbackRaw ? mapItemFeedback(feedbackRaw) : null,
  };
}

const itemSchema = z.object({
  id: z.string().uuid(),
  entry_id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  position: z.number(),
  tracking_type: z.nativeEnum(TrackingType),
  note: z.string().nullable(),
  created_at: z.string(),
});

type ItemRaw = z.infer<typeof itemSchema>;

export interface Item {
  id: string;
  entryId: string;
  userId: string;
  name: string;
  position: number;
  trackingType: TrackingType;
  note: string | null;
  createdAt: string;
}

function mapItem(raw: ItemRaw): Item {
  return {
    id: raw.id,
    entryId: raw.entry_id,
    userId: raw.user_id,
    name: raw.name,
    position: raw.position,
    trackingType: raw.tracking_type,
    note: raw.note,
    createdAt: raw.created_at,
  };
}

export interface CreateItemInput {
  entryId: string;
  userId: string;
  name: string;
  position: number;
}

@Service()
export class ItemsService {
  private readonly supabase: SupabaseClient = inject(SupabaseService).client;

  async getSessionData(entryId: string): Promise<Result<SessionItem[]>> {
    const { data, error } = await this.supabase
      .from('items')
      .select('*, item_sets(*), item_feedback(*)')
      .eq('entry_id', entryId)
      .order('position');
    if (error) {
      return err(mapSupabaseError(error));
    }
    const validated = sessionItemArraySchema.safeParse(data);
    if (!validated.success) {
      return err(new ValidationError('Invalid session data'));
    }
    return ok(validated.data.map(mapSessionItem));
  }

  async createItem(input: CreateItemInput): Promise<Result<Item>> {
    const { data, error } = await this.supabase
      .from('items')
      .insert({
        entry_id: input.entryId,
        user_id: input.userId,
        name: input.name,
        position: input.position,
      })
      .select()
      .single();
    if (error) {
      return err(mapSupabaseError(error));
    }
    const validated = itemSchema.safeParse(data);
    if (!validated.success) {
      return err(new ValidationError('Invalid item data'));
    }
    return ok(mapItem(validated.data));
  }

  async updateItemNote(itemId: string, note: string): Promise<Result<void>> {
    const { error } = await this.supabase
      .from('items')
      .update({ note })
      .eq('id', itemId);
    if (error) {
      return err(mapSupabaseError(error));
    }
    return ok(undefined);
  }

  async deleteItem(itemId: string): Promise<Result<void>> {
    const { error } = await this.supabase.from('items').delete().eq('id', itemId);
    if (error) {
      return err(mapSupabaseError(error));
    }
    return ok(undefined);
  }
}
