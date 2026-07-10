import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/platform/auth.service';
import { AppRoute } from '../enums/app-route.enum';
import { AuthRoute } from '../enums/auth-route.enum';

export const deviceVerificationPendingGuard: CanActivateFn = () => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  if (authService.pendingOtpChallengeId() !== null) {
    return true;
  }

  return router.createUrlTree([AppRoute.Auth, AuthRoute.Login]);
};
