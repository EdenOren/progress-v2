import { parseSessionItems } from './items.service';
import { FeedbackRating } from '../../../shared/enums/feedback-rating.enum';
import { TrackingType } from '../../../shared/enums/tracking-type.enum';

const CREATED_AT: string = '2026-11-14T00:00:00.000Z';

const FEEDBACK_ROW: Record<string, unknown> = {
  id: 'feedback-1',
  item_id: 'item-1',
  user_id: 'user-1',
  rating: FeedbackRating.Hard,
  comment: null,
  created_at: CREATED_AT,
};

function buildItemRow(itemFeedback: unknown): Record<string, unknown> {
  return {
    id: 'item-1',
    entry_id: 'entry-1',
    user_id: 'user-1',
    name: 'Back Squat',
    position: 0,
    tracking_type: TrackingType.WeightReps,
    note: null,
    created_at: CREATED_AT,
    item_sets: [
      {
        id: 'set-2',
        item_id: 'item-1',
        user_id: 'user-1',
        set_index: 1,
        weight_kg: 105,
        reps: 5,
        duration_sec: null,
        distance_m: null,
        notes: null,
        created_at: CREATED_AT,
      },
      {
        id: 'set-1',
        item_id: 'item-1',
        user_id: 'user-1',
        set_index: 0,
        weight_kg: 100,
        reps: 5,
        duration_sec: null,
        distance_m: null,
        notes: null,
        created_at: CREATED_AT,
      },
    ],
    item_feedback: itemFeedback,
  };
}

describe('parseSessionItems', () => {
  it('accepts feedback embedded as null when an item has no rating', () => {
    const [item] = parseSessionItems([buildItemRow(null)]) ?? [];
    expect(item.feedback).toBeNull();
  });

  it('accepts feedback embedded as a single object', () => {
    const [item] = parseSessionItems([buildItemRow(FEEDBACK_ROW)]) ?? [];
    expect(item.feedback?.rating).toBe(FeedbackRating.Hard);
  });

  it('still accepts feedback embedded as an array', () => {
    const [ratedItem] = parseSessionItems([buildItemRow([FEEDBACK_ROW])]) ?? [];
    const [unratedItem] = parseSessionItems([buildItemRow([])]) ?? [];
    expect(ratedItem.feedback?.rating).toBe(FeedbackRating.Hard);
    expect(unratedItem.feedback).toBeNull();
  });

  it('orders sets by their index', () => {
    const [item] = parseSessionItems([buildItemRow(null)]) ?? [];
    expect(item.sets.map((set) => set.id)).toEqual(['set-1', 'set-2']);
  });

  it('returns null for rows of the wrong shape', () => {
    expect(parseSessionItems([{ id: 'item-1' }])).toBeNull();
  });
});
