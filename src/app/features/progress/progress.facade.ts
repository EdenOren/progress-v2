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
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from '../../core/services/platform/auth.service';
import { SupabaseService } from '../../core/services/platform/supabase.service';
import { getWorkoutDomainId } from '../../core/services/data/domains.data';
import { createSubject, getSubjects } from '../../core/services/data/subjects.data';
import type { Subject } from '../../core/services/data/subjects.data';
import type { Result } from '../../core/types/result';
import { AppRoute } from '../../core/enums/app-route.enum';
import { ProgressRoute } from '../../core/enums/progress-route.enum';
import { CreateSubjectDialogComponent } from './components/create-subject-dialog/create-subject-dialog.component';
import type { CreateSubjectFormData } from './components/create-subject-dialog/create-subject-dialog.component';

@Service({ autoProvided: false })
export class ProgressFacade {
  private readonly supabase: SupabaseClient = inject(SupabaseService).client;
  private readonly authService: AuthService = inject(AuthService);
  private readonly router: Router = inject(Router);
  private readonly dialog: MatDialog = inject(MatDialog);
  private readonly translateService: TranslateService = inject(TranslateService);

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('PROGRESS'),
    { initialValue: {} as Record<string, string> },
  );

  private readonly domainIdResource: ResourceRef<Result<string> | undefined> = resource({
    loader: () => getWorkoutDomainId(this.supabase),
  });

  readonly workoutDomainId: Signal<string | null> = computed(() => {
    const result = this.domainIdResource.value();
    if (!result || !result.success) {
      return null;
    }
    return result.data;
  });

  private readonly _subjectsResource: ResourceRef<Result<Subject[]> | undefined> = resource({
    params: () => ({ userId: this.authService.userId(), domainId: this.workoutDomainId() }),
    loader: ({ params }) => {
      if (!params.domainId) {
        return Promise.resolve(undefined);
      }
      return getSubjects(this.supabase, params.userId);
    },
  });

  readonly subjects: Signal<Subject[]> = computed(() => {
    const result = this._subjectsResource.value();
    if (!result || !result.success) {
      return [];
    }
    return result.data;
  });

  readonly isLoading: Signal<boolean> = computed(
    () => this._subjectsResource.isLoading() || this.domainIdResource.isLoading(),
  );

  readonly hasError: Signal<boolean> = computed(() => {
    const result = this._subjectsResource.value();
    return !!result && !result.success;
  });

  readonly isEmpty: Signal<boolean> = computed(
    () => !this.isLoading() && !this.hasError() && !this.subjects().length,
  );

  private readonly _errorMessage: WritableSignal<string> = signal('');
  readonly errorMessage: Signal<string> = this._errorMessage;

  async openCreateSubjectDialog(): Promise<void> {
    const domainId: string | null = this.workoutDomainId();
    if (!domainId) {
      return;
    }
    const dialogRef = this.dialog.open(
      CreateSubjectDialogComponent,
      { width: CreateSubjectDialogComponent.DIALOG_WIDTH },
    );
    const formData: CreateSubjectFormData | undefined = await firstValueFrom(dialogRef.afterClosed());
    if (!formData) {
      return;
    }
    this._errorMessage.set('');
    const result: Result<Subject> = await createSubject(this.supabase, {
      userId: this.authService.userId(),
      domainId,
      name: formData.name,
      description: formData.description || null,
    });
    if (!result.success) {
      this._errorMessage.set(result.error.message);
      return;
    }
    this._subjectsResource.reload();
  }

  navigateToSubject(subjectId: string): void {
    void this.router.navigate([AppRoute.Progress, ProgressRoute.Subject, subjectId]);
  }
}
