import {
  computed,
  effect,
  inject,
  resource,
  ResourceRef,
  Service,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, map } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from '../../core/services/platform/auth.service';
import { SupabaseService } from '../../core/services/platform/supabase.service';
import {
  getEntry,
  startEntry,
  completeEntry,
  getLastCompletedEntry,
} from '../../core/services/data/entries.data';
import type { Entry } from '../../core/services/data/entries.data';
import {
  getSessionData,
  createItem,
  updateItemNote,
  deleteItem,
} from '../../core/services/data/items.data';
import type { SessionItem, ItemSet } from '../../core/services/data/items.data';
import { upsertItemSet, deleteItemSet } from '../../core/services/data/item-sets.data';
import type { SetChangedPayload } from '../../core/services/data/item-sets.data';
import { upsertItemFeedback } from '../../core/services/data/item-feedback.data';
import { getWorkoutSettings } from '../../core/services/data/user-settings.data';
import type { WorkoutSettings } from '../../core/services/data/user-settings.data';
import type { Result } from '../../core/types/result';
import { AppRoute } from '../../core/enums/app-route.enum';
import { ProgressRoute } from '../../core/enums/progress-route.enum';
import { FeedbackRating } from '../../shared/enums/feedback-rating.enum';
import { DistanceUnit } from '../../shared/enums/distance-unit.enum';
import {
  AddItemDialogComponent,
} from './components/add-item-dialog/add-item-dialog.component';
import {
  CompleteSessionDialogComponent,
} from './components/complete-session-dialog/complete-session-dialog.component';
import type { CompleteSessionDialogData } from './components/complete-session-dialog/complete-session-dialog.component';

@Service({ autoProvided: false })
export class EntryFacade {
  private static readonly SECONDS_PER_MINUTE: number = 60;
  private static readonly TIMER_INTERVAL_MS: number = 1000;

  private readonly supabase: SupabaseClient = inject(SupabaseService).client;
  private readonly authService: AuthService = inject(AuthService);
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly dialog: MatDialog = inject(MatDialog);
  private readonly translateService: TranslateService = inject(TranslateService);

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('ENTRY'),
    { initialValue: {} as Record<string, string> },
  );

  private readonly subjectIdParam: Signal<string | undefined> = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('subjectId') ?? undefined)),
  );

  private readonly _entryIdParam: Signal<string | undefined> = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('entryId') ?? undefined)),
  );

  private readonly _entryResource: ResourceRef<Result<Entry> | undefined> = resource({
    params: () => ({ entryId: this._entryIdParam(), userId: this.authService.userId() }),
    loader: ({ params }) => {
      if (!params.entryId || !params.userId) {
        return Promise.resolve(undefined);
      }
      return getEntry(this.supabase, params.entryId, params.userId);
    },
  });

  private readonly _sessionDataResource: ResourceRef<Result<SessionItem[]> | undefined> = resource({
    params: () => ({ entryId: this._entryIdParam() }),
    loader: ({ params }) => {
      if (!params.entryId) {
        return Promise.resolve(undefined);
      }
      return getSessionData(this.supabase, params.entryId);
    },
  });

  private readonly _previousEntryResource: ResourceRef<Result<Entry | null> | undefined> = resource({
    params: () => ({
      subjectId: this.subjectIdParam(),
      userId: this.authService.userId(),
      excludeId: this._entryIdParam(),
    }),
    loader: ({ params }) => {
      if (!params.subjectId || !params.userId) {
        return Promise.resolve(undefined);
      }
      return getLastCompletedEntry(
        this.supabase,
        params.subjectId,
        params.userId,
        params.excludeId,
      );
    },
  });

  private readonly _previousSessionDataResource: ResourceRef<Result<SessionItem[]> | undefined> =
    resource({
      params: () => {
        const result = this._previousEntryResource.value();
        const prevEntry = result?.success ? result.data : null;
        return { entryId: prevEntry?.id };
      },
      loader: ({ params }) => {
        if (!params.entryId) {
          return Promise.resolve(undefined);
        }
        return getSessionData(this.supabase, params.entryId);
      },
    });

  private readonly _userSettingsResource: ResourceRef<Result<WorkoutSettings> | undefined> = resource({
    params: () => ({ userId: this.authService.userId() }),
    loader: ({ params }) => {
      if (!params.userId) {
        return Promise.resolve(undefined);
      }
      return getWorkoutSettings(this.supabase, params.userId);
    },
  });

  readonly entry: Signal<Entry | null> = computed(() => {
    const result = this._entryResource.value();
    return result?.success ? result.data : null;
  });

  readonly items: Signal<SessionItem[]> = computed(() => {
    const result = this._sessionDataResource.value();
    return result?.success ? result.data : [];
  });

  readonly isLoading: Signal<boolean> = computed(
    () => this._entryResource.isLoading() || this._sessionDataResource.isLoading(),
  );

  readonly isCompleted: Signal<boolean> = computed(() => this.entry()?.isCompleted ?? false);

  readonly exerciseCount: Signal<number> = computed(() => this.items().length);

  readonly totalSets: Signal<number> = computed(() =>
    this.items().reduce((sum, item) => sum + item.sets.length, 0),
  );

  readonly previousSetsMap: Signal<Map<string, ItemSet[]>> = computed(() => {
    const result = this._previousSessionDataResource.value();
    if (!result?.success) {
      return new Map<string, ItemSet[]>();
    }
    const map = new Map<string, ItemSet[]>();
    for (const item of result.data) {
      map.set(item.name, item.sets);
    }
    return map;
  });

  readonly distanceUnit: Signal<DistanceUnit> = computed(() => {
    const result = this._userSettingsResource.value();
    return result?.success ? result.data.distanceUnit : DistanceUnit.Km;
  });

  private readonly _startedAt: Signal<Date | null> = computed(() => {
    const entry = this.entry();
    return entry?.startedAt ? new Date(entry.startedAt) : null;
  });

  private readonly _elapsedSeconds: WritableSignal<number> = signal(0);
  readonly elapsedSeconds: Signal<number> = this._elapsedSeconds;

  readonly formattedTime: Signal<string> = computed(() => {
    const totalSeconds = this._elapsedSeconds();
    const minutes = Math.floor(totalSeconds / EntryFacade.SECONDS_PER_MINUTE);
    const seconds = totalSeconds % EntryFacade.SECONDS_PER_MINUTE;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  });

  private readonly _errorMessage: WritableSignal<string> = signal('');
  readonly errorMessage: Signal<string> = this._errorMessage;

  private startEntryPending = false;

  constructor() {
    effect((onCleanup) => {
      const startedAt = this._startedAt();
      if (!startedAt) {
        return;
      }
      const tick = setInterval(() => {
        this._elapsedSeconds.set(
          Math.floor((Date.now() - startedAt.getTime()) / EntryFacade.TIMER_INTERVAL_MS),
        );
      }, EntryFacade.TIMER_INTERVAL_MS);
      onCleanup(() => clearInterval(tick));
    });

    effect(() => {
      const entry = this.entry();
      if (entry && !entry.startedAt && !entry.isCompleted && !this.startEntryPending) {
        this.startEntryPending = true;
        void this.callStartEntry(entry.id);
      }
    });
  }

  private async callStartEntry(entryId: string): Promise<void> {
    await startEntry(this.supabase, entryId);
    this._entryResource.reload();
  }

  async addItem(name: string): Promise<void> {
    const entryId = this._entryIdParam();
    const userId = this.authService.userId();
    if (!entryId || !userId) {
      return;
    }
    const position = this.items().length;
    const result = await createItem(this.supabase, { entryId, userId, name, position });
    if (!result.success) {
      this._errorMessage.set(result.error.message);
      return;
    }
    this._sessionDataResource.reload();
  }

  async deleteItem(itemId: string): Promise<void> {
    const result = await deleteItem(this.supabase, itemId);
    if (!result.success) {
      this._errorMessage.set(result.error.message);
      return;
    }
    this._sessionDataResource.reload();
  }

  async addSet(itemId: string): Promise<void> {
    const userId = this.authService.userId();
    if (!userId) {
      return;
    }
    const item = this.items().find((candidate) => candidate.id === itemId);
    if (!item) {
      return;
    }
    const nextIndex =
      !item.sets.length ? 0 : Math.max(...item.sets.map((setItem) => setItem.setIndex)) + 1;
    const result = await upsertItemSet(this.supabase, {
      itemId,
      userId,
      setIndex: nextIndex,
      weightKg: null,
      reps: null,
      durationSec: null,
      distanceM: null,
    });
    if (!result.success) {
      this._errorMessage.set(result.error.message);
      return;
    }
    this._sessionDataResource.reload();
  }

  async saveSet(itemId: string, setIndex: number, payload: SetChangedPayload): Promise<void> {
    const userId = this.authService.userId();
    if (!userId) {
      return;
    }
    const result = await upsertItemSet(this.supabase, {
      itemId,
      userId,
      setIndex,
      weightKg: payload.weightKg,
      reps: payload.reps,
      durationSec: payload.durationSec,
      distanceM: payload.distanceM,
    });
    if (!result.success) {
      this._errorMessage.set(result.error.message);
    }
  }

  async deleteSet(itemId: string, setIndex: number): Promise<void> {
    const result = await deleteItemSet(this.supabase, itemId, setIndex);
    if (!result.success) {
      this._errorMessage.set(result.error.message);
      return;
    }
    this._sessionDataResource.reload();
  }

  async saveFeedback(itemId: string, rating: FeedbackRating): Promise<void> {
    const userId = this.authService.userId();
    if (!userId) {
      return;
    }
    const result = await upsertItemFeedback(this.supabase, { itemId, userId, rating });
    if (!result.success) {
      this._errorMessage.set(result.error.message);
      return;
    }
    this._sessionDataResource.reload();
  }

  async saveNote(itemId: string, note: string): Promise<void> {
    const result = await updateItemNote(this.supabase, itemId, note);
    if (!result.success) {
      this._errorMessage.set(result.error.message);
    }
  }

  async openAddItemDialog(): Promise<void> {
    const dialogRef = this.dialog.open(AddItemDialogComponent, {
      width: AddItemDialogComponent.DIALOG_WIDTH,
    });
    const name = await firstValueFrom(dialogRef.afterClosed());
    if (!name) {
      return;
    }
    await this.addItem(name);
  }

  async openCompleteDialog(): Promise<void> {
    const elapsedMinutes = Math.round(
      this._elapsedSeconds() / EntryFacade.SECONDS_PER_MINUTE,
    );
    const dialogData: CompleteSessionDialogData = {
      exerciseCount: this.exerciseCount(),
      totalSets: this.totalSets(),
      elapsedMinutes,
    };
    const dialogRef = this.dialog.open(CompleteSessionDialogComponent, {
      data: dialogData,
      width: CompleteSessionDialogComponent.DIALOG_WIDTH,
    });
    const result = await firstValueFrom(dialogRef.afterClosed());
    if (!result) {
      return;
    }
    await this.completeSession(result.durationSeconds, result.notes);
  }

  async completeSession(durationSeconds: number, notes: string): Promise<void> {
    const entryId = this._entryIdParam();
    if (!entryId) {
      return;
    }
    const result = await completeEntry(this.supabase, {
      entryId,
      durationSeconds,
      notes: notes || null,
    });
    if (!result.success) {
      this._errorMessage.set(result.error.message);
      return;
    }
    this.navigateBack();
  }

  navigateBack(): void {
    const subjectId = this.subjectIdParam();
    if (subjectId) {
      void this.router.navigate([AppRoute.Progress, ProgressRoute.Subject, subjectId]);
    } else {
      void this.router.navigate([AppRoute.Progress]);
    }
  }
}
