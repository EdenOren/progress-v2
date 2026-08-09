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
import { map } from 'rxjs';
import { AuthService } from '../../core/services/platform/auth.service';
import { SessionUiStateService } from '../../core/services/platform/session-ui-state.service';
import { EntriesService } from '../../core/services/data/entries.service';
import type { Entry } from '../../core/services/data/entries.service';
import { ItemsService } from '../../core/services/data/items.service';
import type { SessionItem, ItemSet } from '../../core/services/data/items.service';
import { ItemSetsService } from '../../core/services/data/item-sets.service';
import type { SetChangedPayload } from '../../core/services/data/item-sets.service';
import { ItemFeedbackService } from '../../core/services/data/item-feedback.service';
import { UserSettingsService } from '../../core/services/data/user-settings.service';
import type { WorkoutSettings } from '../../core/services/data/user-settings.service';
import type { Result } from '../../core/types/result';
import { AppRoute } from '../../core/enums/app-route.enum';
import { ProgressRoute } from '../../core/enums/progress-route.enum';
import { FeedbackRating } from '../../shared/enums/feedback-rating.enum';
import { DistanceUnit } from '../../shared/enums/distance-unit.enum';
import { orderSessionItems, resolveActiveItemId } from './session-order.util';
import { DialogService } from '../../shared/services/dialog.service';
import { DialogType } from '../../shared/enums/dialog-type.enum';
import type { CompleteSessionDialogData } from '../../shared/components/complete-session-dialog/complete-session-dialog.component';
import type { CompleteSessionResult } from '../../shared/components/complete-session-dialog/complete-session-dialog.component';

@Service({ autoProvided: false })
export class EntryFacade {
  private static readonly SECONDS_PER_MINUTE: number = 60;
  private static readonly TIMER_INTERVAL_MS: number = 1000;

  private readonly entriesService: EntriesService = inject(EntriesService);
  private readonly itemsService: ItemsService = inject(ItemsService);
  private readonly itemSetsService: ItemSetsService = inject(ItemSetsService);
  private readonly itemFeedbackService: ItemFeedbackService = inject(ItemFeedbackService);
  private readonly userSettingsService: UserSettingsService = inject(UserSettingsService);
  private readonly authService: AuthService = inject(AuthService);
  private readonly sessionUiStateService: SessionUiStateService = inject(SessionUiStateService);
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly dialogService: DialogService = inject(DialogService);
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
      return this.entriesService.getEntry(params.entryId, params.userId);
    },
  });

  private readonly _sessionDataResource: ResourceRef<Result<SessionItem[]> | undefined> = resource({
    params: () => ({ entryId: this._entryIdParam() }),
    loader: ({ params }) => {
      if (!params.entryId) {
        return Promise.resolve(undefined);
      }
      return this.itemsService.getSessionData(params.entryId);
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
      return this.entriesService.getLastCompletedEntry(
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
        return this.itemsService.getSessionData(params.entryId);
      },
    });

  private readonly _userSettingsResource: ResourceRef<Result<WorkoutSettings> | undefined> = resource({
    params: () => ({ userId: this.authService.userId() }),
    loader: ({ params }) => {
      if (!params.userId) {
        return Promise.resolve(undefined);
      }
      return this.userSettingsService.getWorkoutSettings(params.userId);
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

  // An exercise is finished once it carries a feedback rating — the only
  // completion signal the data model has.
  private readonly _activeItemId: WritableSignal<string | null> = signal(null);

  /**
   * The exercise currently expanded. Falls back to the first unrated exercise,
   * then to the last one when everything has been rated.
   */
  readonly activeItemId: Signal<string | null> = computed(() =>
    resolveActiveItemId(this.items(), this._activeItemId()),
  );

  /**
   * Active exercise first, then the rest in order, with rated ones sunk to the
   * bottom.
   */
  readonly orderedItems: Signal<SessionItem[]> = computed(() =>
    orderSessionItems(this.items(), this.activeItemId(), this.isCompleted()),
  );

  setActiveItem(itemId: string): void {
    this._activeItemId.set(itemId);
    const entryId: string | undefined = this._entryIdParam();
    if (entryId) {
      this.sessionUiStateService.setActiveItemId(entryId, itemId);
    }
  }

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
  private activeItemRestored = false;

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

    // Restores the exercise that was open when the browser was last closed.
    // Guarded by a plain boolean rather than a signal so the effect does not
    // re-run on its own write, and so a later user choice is never overwritten.
    effect(() => {
      const entryId: string | undefined = this._entryIdParam();
      if (!entryId || this.activeItemRestored) {
        return;
      }
      this.activeItemRestored = true;
      const storedId: string | null = this.sessionUiStateService.getActiveItemId(entryId);
      if (storedId) {
        this._activeItemId.set(storedId);
      }
    });
  }

  private async callStartEntry(entryId: string): Promise<void> {
    await this.entriesService.startEntry(entryId);
    this._entryResource.reload();
  }

  async addItem(name: string): Promise<void> {
    const entryId = this._entryIdParam();
    const userId = this.authService.userId();
    if (!entryId || !userId) {
      return;
    }
    const position = this.items().length;
    const result = await this.itemsService.createItem({ entryId, userId, name, position });
    if (!result.success) {
      this._errorMessage.set(result.error.message);
      return;
    }
    this._sessionDataResource.reload();
  }

  async deleteItem(itemId: string): Promise<void> {
    const result = await this.itemsService.deleteItem(itemId);
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
    const result = await this.itemSetsService.upsertItemSet({
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
    const result = await this.itemSetsService.upsertItemSet({
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
    const result = await this.itemSetsService.deleteItemSet(itemId, setIndex);
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
    const result = await this.itemFeedbackService.upsertItemFeedback({ itemId, userId, rating });
    if (!result.success) {
      this._errorMessage.set(result.error.message);
      return;
    }
    this._sessionDataResource.reload();
  }

  async saveNote(itemId: string, note: string): Promise<void> {
    const result = await this.itemsService.updateItemNote(itemId, note);
    if (!result.success) {
      this._errorMessage.set(result.error.message);
    }
  }

  async openAddItemDialog(): Promise<void> {
    const name: string | undefined = await this.dialogService.open(DialogType.AddItem);
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
    const result: CompleteSessionResult | undefined = await this.dialogService.open(
      DialogType.CompleteSession,
      dialogData,
    );
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
    const result = await this.entriesService.completeEntry({
      entryId,
      durationSeconds,
      notes: notes || null,
    });
    if (!result.success) {
      this._errorMessage.set(result.error.message);
      return;
    }
    // The session is over, so its stored open-exercise would only accumulate.
    this.sessionUiStateService.clear(entryId);
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
