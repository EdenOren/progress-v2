import { inject, Service } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../platform/supabase.service';
import { mapSupabaseError } from '../../errors/error-mapper';
import { err, ok } from '../../types/result';
import type { Result } from '../../types/result';
import { FeedbackRating } from '../../../shared/enums/feedback-rating.enum';

export interface UpsertItemFeedbackInput {
  itemId: string;
  userId: string;
  rating: FeedbackRating;
}

@Service()
export class ItemFeedbackService {
  private readonly supabase: SupabaseClient = inject(SupabaseService).client;

  async upsertItemFeedback(input: UpsertItemFeedbackInput): Promise<Result<void>> {
    const { error } = await this.supabase
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
}
