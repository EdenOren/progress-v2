import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { LogCardComponent } from './log-card.component';
import { LogMetricKey } from '../../../../shared/enums/log-metric-key.enum';
import type { DailyLog } from '../../../../core/services/data/daily-log/daily-log.model';

const ENTRY: DailyLog = {
  id: 'log-1',
  userId: 'user-1',
  loggedDate: '2026-08-10',
  sleepHours: 7.5,
  weightKg: 81,
  waterLiters: 2.4,
  waistCm: 84,
};

const TRANSLATION: Record<string, string> = {
  SLEEP: 'Sleep',
  WEIGHT: 'Weight',
  WATER: 'Water',
  WAIST: 'Waist',
  SLEEP_UNIT: 'h',
  WATER_UNIT: 'L',
  EDIT: 'Edit',
};

describe('LogCardComponent', () => {
  let fixture: ComponentFixture<LogCardComponent>;

  function renderWithHidden(hiddenMetrics: readonly LogMetricKey[]): HTMLElement {
    fixture = TestBed.createComponent(LogCardComponent);
    fixture.componentRef.setInput('entry', ENTRY);
    fixture.componentRef.setInput('translation', TRANSLATION);
    fixture.componentRef.setInput('hiddenMetrics', hiddenMetrics);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogCardComponent],
    }).compileComponents();
  });

  it('renders every metric when none are hidden', () => {
    const element: HTMLElement = renderWithHidden([]);
    expect(element.querySelectorAll('app-ui-stat-tile').length).toBe(4);
  });

  it('drops only the hidden metrics', () => {
    const element: HTMLElement = renderWithHidden([LogMetricKey.Water, LogMetricKey.Waist]);
    const labels: string[] = Array.from(element.querySelectorAll('app-ui-stat-tile')).map(
      (tile: Element) => tile.textContent ?? '',
    );
    expect(labels.length).toBe(2);
    expect(labels.some((label: string) => label.includes('Water'))).toBe(false);
    expect(labels.some((label: string) => label.includes('Sleep'))).toBe(true);
  });

  // The grid column count only reaches SCSS as a custom property, which silently
  // no-ops if the style binding ever stops supporting `--` names.
  it('publishes the visible column count as a custom property', () => {
    const element: HTMLElement = renderWithHidden([LogMetricKey.Waist]);
    const metrics: HTMLElement | null = element.querySelector('.log-card__metrics');
    expect(metrics?.style.getPropertyValue('--log-card-metric-columns')).toBe('3');
    expect(metrics?.style.getPropertyValue('--log-card-metric-columns-compact')).toBe('2');
  });

  it('caps the compact column count at the visible count', () => {
    const element: HTMLElement = renderWithHidden([
      LogMetricKey.Weight,
      LogMetricKey.Water,
      LogMetricKey.Waist,
    ]);
    const metrics: HTMLElement | null = element.querySelector('.log-card__metrics');
    expect(metrics?.style.getPropertyValue('--log-card-metric-columns-compact')).toBe('1');
  });
});
