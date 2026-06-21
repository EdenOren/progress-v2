import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AppRoute } from './core/enums/app-route.enum';

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
        path: AppRoute.Kpi,
        loadComponent: () =>
          import('./features/kpi/kpi.component').then((m) => m.KpiComponent),
      },
      {
        path: AppRoute.Menu,
        loadComponent: () =>
          import('./features/menu/menu.component').then((m) => m.MenuComponent),
      },
    ],
  },
  {
    path: AppRoute.Auth,
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  { path: '**', redirectTo: '' },
];
