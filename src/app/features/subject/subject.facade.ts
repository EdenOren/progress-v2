import {
  computed,
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
import { SubjectsService } from '../../core/services/data/subjects.service';
import type { Subject } from '../../core/services/data/subjects.service';
import { EntriesService } from '../../core/services/data/entries.service';
import type { Entry } from '../../core/services/data/entries.service';
import type { Result } from '../../core/types/result';
import { AppRoute } from '../../core/enums/app-route.enum';
import { ProgressRoute } from '../../core/enums/progress-route.enum';
import { DialogService } from '../../shared/services/dialog.service';
import { DialogType } from '../../shared/enums/dialog-type.enum';
import type { ConfirmationDialogData } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Service({ autoProvided: false })
export class SubjectFacade {
  private readonly subjectsService: SubjectsService = inject(SubjectsService);
  private readonly entriesService: EntriesService = inject(EntriesService);
  private readonly authService: AuthService = inject(AuthService);
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly dialogService: DialogService = inject(DialogService);
  private readonly translateService: TranslateService = inject(TranslateService);

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('SUBJECT'),
    { initialValue: {} as Record<string, string> },
  );

  private readonly subjectIdParam: Signal<string | undefined> = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('subjectId') ?? undefined)),
  );

  private readonly _subjectResource: ResourceRef<Result<Subject> | undefined> = resource({
    params: () => ({ userId: this.authService.userId(), subjectId: this.subjectIdParam() }),
    loader: ({ params }) => {
      if (!params.subjectId) {
        return Promise.resolve(undefined);
      }
      return this.subjectsService.getSubjectById(params.userId, params.subjectId);
    },
  });

  private readonly _entriesResource: ResourceRef<Result<Entry[]> | undefined> = resource({
    params: () => ({ userId: this.authService.userId(), subjectId: this.subjectIdParam() }),
    loader: ({ params }) => {
      if (!params.subjectId) {
        return Promise.resolve(undefined);
      }
      return this.entriesService.getEntries(params.userId, params.subjectId);
    },
  });

  readonly subject: Signal<Subject | null> = computed(() => {
    const result = this._subjectResource.value();
    if (!result || !result.success) {
      return null;
    }
    return result.data;
  });

  readonly entries: Signal<Entry[]> = computed(() => {
    const result = this._entriesResource.value();
    if (!result || !result.success) {
      return [];
    }
    return result.data;
  });

  readonly isLoading: Signal<boolean> = computed(
    () => this._subjectResource.isLoading() || this._entriesResource.isLoading(),
  );

  readonly hasError: Signal<boolean> = computed(() => {
    const subjectResult = this._subjectResource.value();
    const entriesResult = this._entriesResource.value();
    return (!!subjectResult && !subjectResult.success) || (!!entriesResult && !entriesResult.success);
  });

  readonly isEmpty: Signal<boolean> = computed(
    () => !this.isLoading() && !this.hasError() && !this.entries().length,
  );

  private readonly _errorMessage: WritableSignal<string> = signal('');
  readonly errorMessage: Signal<string> = this._errorMessage;

  private readonly _isStartingWorkout: WritableSignal<boolean> = signal(false);
  readonly isStartingWorkout: Signal<boolean> = this._isStartingWorkout;

  async deleteSubjectWithConfirmation(): Promise<void> {
    const subject = this.subject();
    if (!subject) {
      return;
    }
    const entryCount = this.entries().length;
    const deleteMessage = (this.translation()['DELETE_MESSAGE'] ?? '')
      .replace('{name}', subject.name)
      .replace('{count}', String(entryCount));
    const dialogData: ConfirmationDialogData = {
      title: this.translation()['DELETE_TITLE'] ?? '',
      message: deleteMessage,
      confirmLabel: this.translation()['DELETE_CONFIRM'] ?? '',
      cancelLabel: this.translation()['DELETE_CANCEL'] ?? '',
    };
    const confirmed = await this.dialogService.open(DialogType.Confirmation, dialogData);
    if (!confirmed) {
      return;
    }
    const result = await this.subjectsService.deleteSubject(subject.id);
    if (!result.success) {
      this._errorMessage.set(result.error.message);
      return;
    }
    void this.router.navigate([AppRoute.Progress]);
  }

  async startWorkout(): Promise<void> {
    const subjectId = this.subjectIdParam();
    const userId = this.authService.userId();
    if (!subjectId || !userId) {
      return;
    }
    this._isStartingWorkout.set(true);
    const today = new Date().toISOString().slice(0, 10);
    const result = await this.entriesService.createEntry({
      userId,
      subjectId,
      performedAt: today,
    });
    this._isStartingWorkout.set(false);
    if (!result.success) {
      this._errorMessage.set(result.error.message);
      return;
    }
    this.navigateToEntry(result.data.id);
  }

  navigateToEntry(entryId: string): void {
    const subjectId = this.subjectIdParam();
    if (!subjectId) {
      return;
    }
    void this.router.navigate([AppRoute.Progress, ProgressRoute.Subject, subjectId, ProgressRoute.Entry, entryId]);
  }

  navigateBack(): void {
    void this.router.navigate([AppRoute.Progress]);
  }
}
