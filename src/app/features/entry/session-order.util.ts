import type { SessionItem } from '../../core/services/data/items.service';

/**
 * Resolves which exercise should be expanded.
 *
 * Prefers an explicit choice, but only when it still refers to a live exercise —
 * a stored id can outlive the exercise it names, deleted here or on another
 * device. Otherwise picks the first unrated exercise, and once everything is
 * rated, the last one.
 */
export function resolveActiveItemId(
  items: SessionItem[],
  explicitId: string | null,
): string | null {
  if (!items.length) {
    return null;
  }
  if (explicitId && items.some((item) => item.id === explicitId)) {
    return explicitId;
  }
  const firstUnrated: SessionItem | undefined = items.find((item) => !item.feedback);
  const [lastItem] = items.slice(-1);
  return (firstUnrated ?? lastItem).id;
}

/**
 * Active exercise first, then the rest in their original order, with rated ones
 * sunk to the bottom. A rating is what marks an exercise finished.
 *
 * Completed sessions keep their natural order — everything is expanded and
 * read-only, so there is nothing to sink.
 */
export function orderSessionItems(
  items: SessionItem[],
  activeItemId: string | null,
  isCompleted: boolean,
): SessionItem[] {
  if (isCompleted) {
    return items;
  }
  const active: SessionItem[] = [];
  const unrated: SessionItem[] = [];
  const rated: SessionItem[] = [];
  for (const item of items) {
    if (item.id === activeItemId) {
      active.push(item);
    } else if (item.feedback) {
      rated.push(item);
    } else {
      unrated.push(item);
    }
  }
  return [...active, ...unrated, ...rated];
}
