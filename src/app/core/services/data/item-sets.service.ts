import { inject, Service } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../platform/supabase.service';
import { mapSupabaseError } from '../../errors/error-mapper';
import { err, ok } from '../../types/result';
import type { Result } from '../../types/result';

export interface SetChangedPayload {
  weightKg: number | null;
  reps: number | null;
  durationSec: number | null;
  distanceM: number | null;
}

export interface UpsertItemSetInput {
  itemId: string;
  userId: string;
  setIndex: number;
  weightKg: number | null;
  reps: number | null;
  durationSec: number | null;
  distanceM: number | null;
}

@Service()
export class ItemSetsService {
  private readonly supabase: SupabaseClient = inject(SupabaseService).client;

  async upsertItemSet(input: UpsertItemSetInput): Promise<Result<void>> {
    const { error } = await this.supabase
      .from('item_sets')
      .upsert(
        {
          item_id: input.itemId,
          user_id: input.userId,
          set_index: input.setIndex,
          weight_kg: input.weightKg,
          reps: input.reps,
          duration_sec: input.durationSec,
          distance_m: input.distanceM,
        },
        { onConflict: 'item_id,set_index' },
      );
    if (error) {
      return err(mapSupabaseError(error));
    }
    return ok(undefined);
  }

  async deleteItemSet(itemId: string, setIndex: number): Promise<Result<void>> {
    const { error } = await this.supabase
      .from('item_sets')
      .delete()
      .eq('item_id', itemId)
      .eq('set_index', setIndex);
    if (error) {
      return err(mapSupabaseError(error));
    }
    return ok(undefined);
  }
}
