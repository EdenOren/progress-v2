import { computed, inject, Service, signal, Signal, WritableSignal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { AppRoute } from '../../core/enums/app-route.enum';
import { AuthRoute } from '../../core/enums/auth-route.enum';
import { AppIcon } from '../../shared/enums/app-icon.enum';
import { AuthService } from '../../core/services/platform/auth.service';
import { CurrentProfileService } from '../../core/services/data/profile/current-profile.service';

export interface NavTab {
  route: AppRoute;
  label: string;
  icon: AppIcon;
  isActive: boolean;
}

interface TabConfig {
  route: AppRoute;
  labelKey: string;
  icon: AppIcon;
}

const TABS: TabConfig[] = [
  { route: AppRoute.Progress, labelKey: 'PROGRESS', icon: AppIcon.Progress },
  { route: AppRoute.DailyLog, labelKey: 'DAILY_LOG', icon: AppIcon.DailyLog },
  { route: AppRoute.Kpi, labelKey: 'KPI', icon: AppIcon.Kpi },
  { route: AppRoute.Menu, labelKey: 'MENU', icon: AppIcon.Menu },
];

@Service({ autoProvided: false })
export class HomeFacade {
  private readonly router: Router = inject(Router);
  private readonly translateService: TranslateService = inject(TranslateService);
  private readonly authService: AuthService = inject(AuthService);
  private readonly currentProfileService: CurrentProfileService = inject(CurrentProfileService);

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('NAV'),
    { initialValue: {} as Record<string, string> },
  );

  readonly securityTranslation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('SECURITY'),
    { initialValue: {} as Record<string, string> },
  );

  readonly menuTranslation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('MENU'),
    { initialValue: {} as Record<string, string> },
  );

  readonly profileLabel: Signal<string> = computed(() => this.menuTranslation()['PROFILE'] ?? '');
  readonly settingsLabel: Signal<string> = computed(
    () => this.menuTranslation()['SETTINGS'] ?? '',
  );
  readonly logoutLabel: Signal<string> = computed(() => this.menuTranslation()['LOGOUT'] ?? '');

  private readonly _isLoggingOut: WritableSignal<boolean> = signal(false);
  readonly isLoggingOut: Signal<boolean> = this._isLoggingOut;

  readonly userEmail: Signal<string> = computed(() => this.authService.session()?.user.email ?? '');

  // The chip carries the display name now, and the email only stands in for the
  // moments before the profile arrives — the rail should never sit blank.
  readonly userName: Signal<string> = computed(
    () => this.currentProfileService.displayName() || this.userEmail(),
  );

  readonly userInitial: Signal<string> = computed(() => {
    const [firstCharacter] = this.userName();
    return firstCharacter ? firstCharacter.toUpperCase() : '';
  });

  readonly accountMenuLabel: Signal<string> = computed(() => {
    const name: string = this.userName();
    const label: string = this.menuTranslation()['ACCOUNT_MENU'] ?? '';
    return name && label ? `${name}, ${label}` : name;
  });

  readonly isNewDevice: Signal<boolean> = computed(() => this.authService.isNewDevice());

  readonly newDeviceAlertMessage: Signal<string> = computed(
    () => this.securityTranslation()['NEW_DEVICE_ALERT_MESSAGE'] ?? '',
  );

  readonly newDeviceAlertDismissLabel: Signal<string> = computed(
    () => this.securityTranslation()['NEW_DEVICE_ALERT_DISMISS'] ?? '',
  );

  readonly activeRoute: Signal<AppRoute> = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.resolveActiveRoute()),
    ),
    { initialValue: this.resolveActiveRoute() },
  );

  readonly tabs: Signal<NavTab[]> = computed(() => {
    const translation = this.translation();
    const active = this.activeRoute();
    return TABS.map((tab) => ({
      route: tab.route,
      icon: tab.icon,
      label: translation[tab.labelKey] ?? '',
      isActive: active === tab.route,
    }));
  });

  readonly sidebarTabs: Signal<NavTab[]> = computed(() =>
    this.tabs().filter((tab) => tab.route !== AppRoute.Menu),
  );

  navigateTo(route: AppRoute): void {
    void this.router.navigate([route]);
  }

  navigateToProfile(): void {
    void this.router.navigate([AppRoute.Profile]);
  }

  navigateToSettings(): void {
    void this.router.navigate([AppRoute.Settings]);
  }

  logout(): void {
    void this.performLogout();
  }

  dismissNewDeviceAlert(): void {
    this.authService.acknowledgeNewDevice();
  }

  private async performLogout(): Promise<void> {
    this._isLoggingOut.set(true);
    await this.authService.signOut();
    await this.router.navigate([AppRoute.Auth, AuthRoute.Login]);
    this._isLoggingOut.set(false);
  }

  private resolveActiveRoute(): AppRoute {
    const [, segment] = this.router.url.split('/');
    const match = Object.values(AppRoute).find((route) => route === segment);
    return match ?? AppRoute.Progress;
  }
}
