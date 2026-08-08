import { UiPageComponent } from '@edenoren/ui-kit';
import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-kpi',
  templateUrl: './kpi.component.html',
  styleUrl: './kpi.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, UiPageComponent],
})
export class KpiComponent {
  private readonly translateService: TranslateService = inject(TranslateService);

  protected readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('KPI'),
    { initialValue: {} as Record<string, string> },
  );
}
