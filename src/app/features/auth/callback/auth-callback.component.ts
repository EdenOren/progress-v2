import { ChangeDetectionStrategy, Component, effect, inject, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { translate, Translation, TranslationObject } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/platform/auth.service';
import { AppRoute } from '../../../core/enums/app-route.enum';

@Component({
  selector: 'app-auth-callback',
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthCallbackComponent {
  private readonly authService: AuthService = inject(AuthService);
  private readonly router: Router = inject(Router);

  protected readonly loadingText: Signal<Translation | TranslationObject>;

  constructor() {
    this.loadingText = translate('AUTH.CALLBACK.LOADING');

    effect(() => {
      if (this.authService.isAuthenticated()) {
        void this.router.navigate([AppRoute.Progress]);
      }
    });
  }
}
