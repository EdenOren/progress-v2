import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AppRoute } from './core/enums/app-route.enum';
import { AuthRoute } from './core/enums/auth-route.enum';

export const routes: Routes = [
  { path: '', redirectTo: `${AppRoute.Auth}/${AuthRoute.Login}`, pathMatch: 'full' },
  {
    path: AppRoute.Auth,
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: AppRoute.Progress,
    loadComponent: () =>
      import('./features/progress/progress.component').then((m) => m.ProgressComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: `${AppRoute.Auth}/${AuthRoute.Login}` },
];
