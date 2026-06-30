import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AppRoute } from './core/enums/app-route.enum';
import { ProgressRoute } from './core/enums/progress-route.enum';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: AppRoute.Progress, pathMatch: 'full' },
      {
        path: AppRoute.Progress,
        loadComponent: () =>
          import('./features/progress/progress.component').then((m) => m.ProgressComponent),
      },
      {
        path: `${AppRoute.Progress}/${ProgressRoute.Subject}/:subjectId`,
        loadComponent: () =>
          import('./features/subject/subject.component').then((m) => m.SubjectComponent),
      },
      {
        path: `${AppRoute.Progress}/${ProgressRoute.Subject}/:subjectId/${ProgressRoute.Entry}/:entryId`,
        loadComponent: () =>
          import('./features/entry/entry.component').then((m) => m.EntryComponent),
      },
      {
        path: AppRoute.DailyLog,
        loadComponent: () =>
          import('./features/daily-log/daily-log.component').then((m) => m.DailyLogComponent),
      },
      {
        path: AppRoute.Kpi,
        loadComponent: () =>
          import('./features/kpi/kpi.component').then((m) => m.KpiComponent),
      },
      {
        path: AppRoute.Menu,
        loadComponent: () =>
          import('./features/menu/menu.component').then((m) => m.MenuComponent),
      },
      {
        path: AppRoute.Profile,
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
    ],
  },
  {
    path: AppRoute.Auth,
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  { path: '**', redirectTo: '' },
];
