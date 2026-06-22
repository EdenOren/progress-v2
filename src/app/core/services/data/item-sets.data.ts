import type { SupabaseClient } from '@supabase/supabase-js';
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

export async function upsertItemSet(
  supabase: SupabaseClient,
  input: UpsertItemSetInput,
): Promise<Result<void>> {
  const { error } = await supabase
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

export async function deleteItemSet(
  supabase: SupabaseClient,
  itemId: string,
  setIndex: number,
): Promise<Result<void>> {
  const { error } = await supabase
    .from('item_sets')
    .delete()
    .eq('item_id', itemId)
    .eq('set_index', setIndex);
  if (error) {
    return err(mapSupabaseError(error));
  }
  return ok(undefined);
}
