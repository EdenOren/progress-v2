import { ButtonSize, ButtonType, ButtonVariant, UiButtonComponent, UiIconComponent } from '@edenoren/ui-kit';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { HomeFacade } from './home.facade';
import { AppRoute } from '../../core/enums/app-route.enum';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [HomeFacade],
  imports: [RouterOutlet, UiIconComponent, UiButtonComponent, MatMenuModule, MatIconModule],
})
export class HomeComponent {
  protected readonly facade: HomeFacade = inject(HomeFacade);
  protected readonly buttonType: typeof ButtonType = ButtonType;
  protected readonly buttonVariant: typeof ButtonVariant = ButtonVariant;
  protected readonly buttonSize: typeof ButtonSize = ButtonSize;

  protected navigate(route: AppRoute): void {
    this.facade.navigateTo(route);
  }

  protected dismissDeviceAlert(): void {
    this.facade.dismissNewDeviceAlert();
  }

  protected navigateToProfile(): void {
    this.facade.navigateToProfile();
  }

  protected navigateToSettings(): void {
    this.facade.navigateToSettings();
  }

  protected logout(): void {
    this.facade.logout();
  }
}
