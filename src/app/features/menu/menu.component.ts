import { ButtonType, UiIconComponent, UiPageComponent } from '@edenoren/ui-kit';
import { ChangeDetectionStrategy, Component, computed, inject, signal, Signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { AppRoute } from '../../core/enums/app-route.enum';
import { AuthRoute } from '../../core/enums/auth-route.enum';
import { AuthService } from '../../core/services/platform/auth.service';
import { AppIcon } from '../../shared/enums/app-icon.enum';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiIconComponent, UiPageComponent],
})
export class MenuComponent {
  private readonly router: Router = inject(Router);
  private readonly translateService: TranslateService = inject(TranslateService);
  private readonly authService: AuthService = inject(AuthService);

  protected readonly buttonType: typeof ButtonType = ButtonType;
  protected readonly appIcon: typeof AppIcon = AppIcon;

  private readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('MENU'),
    { initialValue: {} as Record<string, string> },
  );

  readonly titleLabel: Signal<string> = computed(() => this.translation()['TITLE'] ?? '');
  readonly profileLabel: Signal<string> = computed(() => this.translation()['PROFILE'] ?? '');
  readonly settingsLabel: Signal<string> = computed(() => this.translation()['SETTINGS'] ?? '');
  readonly logoutLabel: Signal<string> = computed(() => this.translation()['LOGOUT'] ?? '');

  private readonly _isLoggingOut: WritableSignal<boolean> = signal(false);
  readonly isLoggingOut: Signal<boolean> = this._isLoggingOut;

  protected onNavigateToProfile(): void {
    void this.router.navigate([AppRoute.Profile]);
  }

  protected onNavigateToSettings(): void {
    void this.router.navigate([AppRoute.Settings]);
  }

  protected onLogout(): void {
    void this.performLogout();
  }

  private async performLogout(): Promise<void> {
    this._isLoggingOut.set(true);
    await this.authService.signOut();
    await this.router.navigate([AppRoute.Auth, AuthRoute.Login]);
    this._isLoggingOut.set(false);
  }
}
