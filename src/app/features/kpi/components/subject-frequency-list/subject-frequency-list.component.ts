import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  InputSignal,
  Signal,
} from '@angular/core';
import type { SubjectFrequency } from '../../utils/kpi-metrics.util';

interface SubjectFrequencyBar {
  readonly subjectId: string;
  readonly subjectName: string;
  readonly sessionCount: number;
  readonly widthPercent: number;
}

@Component({
  selector: 'app-subject-frequency-list',
  templateUrl: './subject-frequency-list.component.html',
  styleUrl: './subject-frequency-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubjectFrequencyListComponent {
  private static readonly FULL_WIDTH_PERCENT: number = 100;

  readonly subjects: InputSignal<SubjectFrequency[]> = input.required<SubjectFrequency[]>();

  protected readonly rows: Signal<SubjectFrequencyBar[]> = computed(() => {
    const subjects: SubjectFrequency[] = this.subjects();
    const busiest: number = Math.max(...subjects.map((subject) => subject.sessionCount), 0);
    return subjects.map((subject) => ({
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      sessionCount: subject.sessionCount,
      widthPercent: busiest
        ? (subject.sessionCount / busiest) * SubjectFrequencyListComponent.FULL_WIDTH_PERCENT
        : 0,
    }));
  });
}
