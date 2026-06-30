import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { ButtonVariant } from '../../shared/enums/button-variant.enum';
import { AppRoute } from '../../core/enums/app-route.enum';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent],
})
export class MenuComponent {
  private readonly router: Router = inject(Router);
  private readonly translateService: TranslateService = inject(TranslateService);

  protected readonly buttonVariant: typeof ButtonVariant = ButtonVariant;

  private readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('MENU'),
    { initialValue: {} as Record<string, string> },
  );

  readonly profileLabel: Signal<string> = computed(() => this.translation()['PROFILE'] ?? '');

  protected onNavigateToProfile(): void {
    void this.router.navigate([AppRoute.Profile]);
  }
}
