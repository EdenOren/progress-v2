import { Service } from '@angular/core';
import { z } from 'zod';
import { StorageKey } from '../../enums/storage-key.enum';

const activeItemSchema: z.ZodType<string> = z.string().uuid();

/**
 * Persists the small amount of session view state that the database does not
 * already hold.
 *
 * Sets, feedback, notes and the elapsed timer all round-trip through Supabase,
 * so reopening a session restores them. The exception is which exercise the
 * user had open — that lives only in memory, and losing it mid-workout means
 * hunting for your place again.
 *
 * localStorage rather than a column: this is per-device view state. A column
 * would sync the open exercise across devices, which is not wanted, and would
 * cost a migration.
 */
@Service()
export class SessionUiStateService {
  getActiveItemId(entryId: string): string | null {
    const raw: string | null = this.read(this.buildKey(entryId));
    if (!raw) {
      return null;
    }
    // Treated as untrusted: another tab, an older build, or a user editing
    // devtools can all put arbitrary text here.
    const parsed: z.ZodSafeParseResult<string> = activeItemSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  }

  setActiveItemId(entryId: string, itemId: string): void {
    this.write(this.buildKey(entryId), itemId);
  }

  clear(entryId: string): void {
    try {
      localStorage.removeItem(this.buildKey(entryId));
    } catch {
      // Storage being unavailable must never break a workout.
    }
  }

  private buildKey(entryId: string): string {
    return `${StorageKey.SessionActiveItem}.${entryId}`;
  }

  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      // Private-mode browsers throw on access rather than returning null.
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Quota exceeded or storage disabled — degrade to in-memory state.
    }
  }
}
