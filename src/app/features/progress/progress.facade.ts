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
import { AuthService } from '../../core/services/platform/auth.service';
import { DomainsService } from '../../core/services/data/domains.service';
import { SubjectsService } from '../../core/services/data/subjects.service';
import type { Subject } from '../../core/services/data/subjects.service';
import type { Result } from '../../core/types/result';
import { AppRoute } from '../../core/enums/app-route.enum';
import { ProgressRoute } from '../../core/enums/progress-route.enum';
import { DialogService } from '../../shared/services/dialog.service';
import { DialogType } from '../../shared/enums/dialog-type.enum';
import type { CreateSubjectFormData } from '../../shared/components/create-subject-dialog/create-subject-dialog.component';

@Service({ autoProvided: false })
export class ProgressFacade {
  private readonly domainsService: DomainsService = inject(DomainsService);
  private readonly subjectsService: SubjectsService = inject(SubjectsService);
  private readonly authService: AuthService = inject(AuthService);
  private readonly router: Router = inject(Router);
  private readonly dialogService: DialogService = inject(DialogService);
  private readonly translateService: TranslateService = inject(TranslateService);

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('PROGRESS'),
    { initialValue: {} as Record<string, string> },
  );

  private readonly domainIdResource: ResourceRef<Result<string> | undefined> = resource({
    loader: () => this.domainsService.getWorkoutDomainId(),
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
      return this.subjectsService.getSubjects(params.userId);
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
    const formData: CreateSubjectFormData | undefined = await this.dialogService.open(DialogType.CreateSubject);
    if (!formData) {
      return;
    }
    this._errorMessage.set('');
    const result: Result<Subject> = await this.subjectsService.createSubject({
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
