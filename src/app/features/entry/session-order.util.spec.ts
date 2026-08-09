import { orderSessionItems, resolveActiveItemId } from './session-order.util';
import type { SessionItem } from '../../core/services/data/items.service';
import { FeedbackRating } from '../../shared/enums/feedback-rating.enum';
import { TrackingType } from '../../shared/enums/tracking-type.enum';

function buildItem(id: string, rating: FeedbackRating | null = null): SessionItem {
  return {
    id,
    entryId: 'entry-1',
    userId: 'user-1',
    name: id,
    position: 0,
    trackingType: TrackingType.WeightReps,
    note: null,
    createdAt: '2026-08-08T00:00:00.000Z',
    sets: [],
    feedback: rating
      ? {
          id: `feedback-${id}`,
          itemId: id,
          userId: 'user-1',
          rating,
          comment: null,
          createdAt: '2026-08-08T00:00:00.000Z',
        }
      : null,
  };
}

describe('resolveActiveItemId', () => {
  it('returns null when there are no exercises', () => {
    expect(resolveActiveItemId([], null)).toBeNull();
  });

  it('honours an explicit choice', () => {
    const items: SessionItem[] = [buildItem('a'), buildItem('b')];

    expect(resolveActiveItemId(items, 'b')).toBe('b');
  });

  it('falls back when the stored exercise no longer exists', () => {
    // The exercise was deleted here or on another device.
    const items: SessionItem[] = [buildItem('a'), buildItem('b')];

    expect(resolveActiveItemId(items, 'deleted')).toBe('a');
  });

  it('defaults to the first unrated exercise', () => {
    const items: SessionItem[] = [
      buildItem('a', FeedbackRating.Success),
      buildItem('b'),
      buildItem('c'),
    ];

    expect(resolveActiveItemId(items, null)).toBe('b');
  });

  it('defaults to the last exercise once every one is rated', () => {
    const items: SessionItem[] = [
      buildItem('a', FeedbackRating.Success),
      buildItem('b', FeedbackRating.Hard),
    ];

    expect(resolveActiveItemId(items, null)).toBe('b');
  });
});

describe('orderSessionItems', () => {
  it('puts the active exercise first', () => {
    const items: SessionItem[] = [buildItem('a'), buildItem('b'), buildItem('c')];

    const ordered: SessionItem[] = orderSessionItems(items, 'c', false);

    expect(ordered.map((item) => item.id)).toEqual(['c', 'a', 'b']);
  });

  it('sinks rated exercises to the bottom', () => {
    const items: SessionItem[] = [
      buildItem('a', FeedbackRating.Success),
      buildItem('b'),
      buildItem('c', FeedbackRating.Fail),
      buildItem('d'),
    ];

    const ordered: SessionItem[] = orderSessionItems(items, 'b', false);

    expect(ordered.map((item) => item.id)).toEqual(['b', 'd', 'a', 'c']);
  });

  it('keeps the active exercise first even when it is already rated', () => {
    const items: SessionItem[] = [
      buildItem('a'),
      buildItem('b', FeedbackRating.Success),
    ];

    const ordered: SessionItem[] = orderSessionItems(items, 'b', false);

    expect(ordered.map((item) => item.id)).toEqual(['b', 'a']);
  });

  it('preserves the original order for a completed session', () => {
    // Everything is expanded and read-only, so there is nothing to sink.
    const items: SessionItem[] = [
      buildItem('a', FeedbackRating.Success),
      buildItem('b'),
      buildItem('c', FeedbackRating.Hard),
    ];

    const ordered: SessionItem[] = orderSessionItems(items, 'b', true);

    expect(ordered.map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('never drops or duplicates an exercise', () => {
    const items: SessionItem[] = [
      buildItem('a', FeedbackRating.Success),
      buildItem('b'),
      buildItem('c', FeedbackRating.Fail),
    ];

    const ordered: SessionItem[] = orderSessionItems(items, 'c', false);

    expect(ordered).toHaveLength(items.length);
    expect(new Set(ordered.map((item) => item.id))).toEqual(new Set(['a', 'b', 'c']));
  });
});
