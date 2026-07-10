import { Routes } from '@angular/router';
import { AuthRoute } from '../../core/enums/auth-route.enum';
import { guestGuard } from '../../core/guards/guest.guard';
import { deviceVerificationPendingGuard } from '../../core/guards/device-verification-pending.guard';

export const authRoutes: Routes = [
  {
    path: AuthRoute.Login,
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: AuthRoute.Signup,
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./signup/signup.component').then((m) => m.SignupComponent),
  },
  {
    path: AuthRoute.Callback,
    loadComponent: () =>
      import('./callback/auth-callback.component').then((m) => m.AuthCallbackComponent),
  },
  {
    path: AuthRoute.ForgotPassword,
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: AuthRoute.ResetPassword,
    loadComponent: () =>
      import('./reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
  },
  {
    path: AuthRoute.VerifyDevice,
    canActivate: [deviceVerificationPendingGuard],
    loadComponent: () =>
      import('./verify-device/verify-device.component').then((m) => m.VerifyDeviceComponent),
  },
  { path: '', redirectTo: AuthRoute.Login, pathMatch: 'full' },
];
