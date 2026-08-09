import { UiPageComponent } from '@edenoren/ui-kit';
import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MaterialIcon } from '../../shared/enums/material-icon.enum';

@Component({
  selector: 'app-kpi',
  templateUrl: './kpi.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, UiPageComponent, EmptyStateComponent],
})
export class KpiComponent {
  private readonly translateService: TranslateService = inject(TranslateService);
  protected readonly MaterialIcon: typeof MaterialIcon = MaterialIcon;

  protected readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('KPI'),
    { initialValue: {} as Record<string, string> },
  );
}
