import type { SupabaseClient } from '@supabase/supabase-js';
import { mapSupabaseError } from '../../errors/error-mapper';
import { err, ok } from '../../types/result';
import type { Result } from '../../types/result';
import { FeedbackRating } from '../../../shared/enums/feedback-rating.enum';

export interface UpsertItemFeedbackInput {
  itemId: string;
  userId: string;
  rating: FeedbackRating;
}

export async function upsertItemFeedback(
  supabase: SupabaseClient,
  input: UpsertItemFeedbackInput,
): Promise<Result<void>> {
  const { error } = await supabase
    .from('item_feedback')
    .upsert(
      {
        item_id: input.itemId,
        user_id: input.userId,
        rating: input.rating,
      },
      { onConflict: 'item_id' },
    );
  if (error) {
    return err(mapSupabaseError(error));
  }
  return ok(undefined);
}
