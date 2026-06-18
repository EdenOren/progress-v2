import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/platform/auth.service';
import { AppRoute } from '../enums/app-route.enum';

export const guestGuard: CanActivateFn = async () => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  await authService.initialized;

  if (authService.isAuthenticated()) {
    return router.createUrlTree([AppRoute.Progress]);
  }

  return true;
};
