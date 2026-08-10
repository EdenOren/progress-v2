import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  InputSignal,
  Signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import type { VolumeBucket } from '../../utils/kpi-metrics.util';

interface VolumeBar {
  readonly startIsoDate: string;
  readonly volume: number;
  readonly heightPercent: number;
}

@Component({
  selector: 'app-volume-chart',
  templateUrl: './volume-chart.component.html',
  styleUrl: './volume-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
})
export class VolumeChartComponent {
  private static readonly FULL_HEIGHT_PERCENT: number = 100;

  readonly buckets: InputSignal<VolumeBucket[]> = input.required<VolumeBucket[]>();
  readonly unit: InputSignal<string> = input.required<string>();
  readonly dateColumnLabel: InputSignal<string> = input.required<string>();
  readonly volumeColumnLabel: InputSignal<string> = input.required<string>();
  readonly tableCaption: InputSignal<string> = input.required<string>();

  protected readonly firstBucketDate: Signal<string> = computed(() => {
    const [first] = this.buckets();
    return first?.startIsoDate ?? '';
  });

  protected readonly lastBucketDate: Signal<string> = computed(() => {
    const [last] = [...this.buckets()].reverse();
    return last?.startIsoDate ?? '';
  });

  private readonly peakVolume: Signal<number> = computed(() =>
    Math.max(...this.buckets().map((bucket) => bucket.volumeKg), 0),
  );

  // Bars are scaled against the tallest bar in view, so a light week still
  // shows shape instead of flattening against an absolute ceiling.
  protected readonly bars: Signal<VolumeBar[]> = computed(() => {
    const peak: number = this.peakVolume();
    return this.buckets().map((bucket) => ({
      startIsoDate: bucket.startIsoDate,
      volume: Math.round(bucket.volumeKg),
      heightPercent: peak
        ? (bucket.volumeKg / peak) * VolumeChartComponent.FULL_HEIGHT_PERCENT
        : 0,
    }));
  });
}
