import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HomeFacade } from './home.facade';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { ButtonType } from '../../shared/enums/button-type.enum';
import { AppRoute } from '../../core/enums/app-route.enum';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [HomeFacade],
  imports: [RouterOutlet, UiIconComponent],
})
export class HomeComponent {
  protected readonly facade: HomeFacade = inject(HomeFacade);
  protected readonly buttonType: typeof ButtonType = ButtonType;

  protected navigate(route: AppRoute): void {
    this.facade.navigateTo(route);
  }
}
