import { computed, inject, Service, Signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { AppRoute } from '../../core/enums/app-route.enum';
import { AppIcon } from '../../shared/enums/app-icon.enum';

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

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('NAV'),
    { initialValue: {} as Record<string, string> },
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

  navigateTo(route: AppRoute): void {
    void this.router.navigate([route]);
  }

  private resolveActiveRoute(): AppRoute {
    const [, segment] = this.router.url.split('/');
    const match = Object.values(AppRoute).find((route) => route === segment);
    return match ?? AppRoute.Progress;
  }
}
